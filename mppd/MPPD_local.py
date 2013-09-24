#!/usr/bin/env python

import os
import re
import tempfile
import zipfile
import collections
import sqlite3
import json
import datetime
import csv
import codecs
from cStringIO import StringIO

from flask import (
    Flask, request, render_template, 
    send_from_directory, send_file, url_for
)


cfg_file = 'app.cfg'

app = Flask( __name__ )
app.config.from_pyfile( cfg_file )

URL_DIR = app.config.get("URL_PREFIX", "")
APP_PATH = app.config.get("APP_PATH", "")
VERSION = "3.1"



def get_nop(config):
    with sqlite3.connect( config['DATABASE'] ) as conn:
        c = conn.cursor()
        c.execute('SELECT COUNT(*) FROM mppddbrecord')
        nop = c.fetchone()[0]         
    return nop

def get_names(config):
    with sqlite3.connect( config['DATABASE'] ) as conn:
        c = conn.cursor()
        c.execute('PRAGMA table_info(mppddbrecord)')
        names = c.fetchall()
    return [ row[1] for row in names ]


NOP = get_nop( app.config )
NAMES = get_names( app.config )
print NAMES

def read_entries(config, request, table=False):
    where = []
    pdbids = ""
    keywds = request.args.get('keywds')
    
    if keywds:
        # keywds = re.split( "[\s,]+", keywds.upper() )
        keywds = re.findall( 
            r"[^\s,\"']+|\"[^\"]*\"|'[^']*'", keywds.upper()
        )
        keywds = [ k.strip("'\"") for k in keywds ]
        print keywds
        pdbids = [ x for x in keywds if len(x)==4 ]

    if pdbids:
        where.append( 
            " OR ".join([ 
                "pdb_id = \'%s\' COLLATE NOCASE" % x for x in pdbids 
            ])
        )
   
    if keywds:
        where.append( 
            " OR ".join([ 
                (   
                    "pdb_keywords like \'%%%s%%\' COLLATE NOCASE OR "
                    "pdb_title like \'%%%s%%\' COLLATE NOCASE OR "
                    "mpstruc_subgroup like \'%%%s%%\' COLLATE NOCASE OR "
                    "mpstruc_name like \'%%%s%%\' COLLATE NOCASE OR "
                    "opm_family like \'%%%s%%\' COLLATE NOCASE"
                ) % ( x, x, x, x, x ) 
                for x in keywds 
            ])
        )
    
    if where:
        where = "WHERE (" + ( ") OR (".join( where ) ) + ")"
    else:
        where = ""

    sortby = request.args.get('sortby', 'pdb_id')
    direction = request.args.get('dir', 'ASC')
    order_clause = "ORDER BY %s %s" % ( sortby, direction )

    start = int( request.args.get('start', 0) )
    limit = int( request.args.get('limit', 0) )
    limit_clause = "LIMIT %i, %i" % ( start, limit) if limit else ""

    query = (
        "SELECT * "
        "FROM mppddbrecord "
        "" + where + ""
        " " + order_clause + ""
        " " + limit_clause + ""
    )
    query_count = (
        "SELECT COUNT(*) "
        "FROM mppddbrecord "
        "" + where + ""
    )

    print query
    
    pdb_table = []
    with sqlite3.connect( config['DATABASE'] ) as conn:
        c = conn.cursor()
        for row in c.execute( query ):
            pdb_table.append( row )
   
        c.execute( query_count )
        count = c.fetchone()[0]

    return count, pdb_table


def page_url( page ):
    return URL_DIR + url_for( 'pages', page=page )

def static_url( filename ):
    return URL_DIR + url_for( 'staticx', filename=filename )

def img_url( filename ):
    return static_url( "img/" + filename )

def js_url( filename ):
    return static_url( "js/" + filename )

def provi_url( pdb_id ):
    return "%s?dir=mppd&file=%s/mppd.provi" % (
        app.config["PROVI_URL"], pdb_id
    )


@app.route('/', defaults={'page': "welcome"})
@app.route('/<string:page>/')
def pages( page ):
    if page not in [
        "welcome", "grid", "manual", "method", "statistics",
        "faq", "refs", "links"
    ]:
        page = "welcome"
    return render_template(
        '%s.html' % page, nop=NOP, version=VERSION,
        page=page_url, static=static_url, img=img_url, js=js_url, 
        provi=provi_url, provi_url=app.config["PROVI_URL"]
    )


@app.route('/static/<path:filename>')
def staticx(filename):
    return send_from_directory(
        os.path.join( APP_PATH, "static/" ), filename, as_attachment=True
    )


@app.route('/query', methods=['POST','GET'])
def query():
    count, pdb_table = read_entries( 
        app.config, request, table=True
    )
    today = datetime.date.today().isoformat()
    sele = request.args.get('sele')
    if sele:
        sele = map( int, sele.split(",") )
        pdb_table = [ x for i, x in enumerate( pdb_table ) if i in sele ]
    if request.args.get('csv'):
        str_io = StringIO()
        csv_writer = UnicodeCsvWriter(
            str_io, delimiter=',', 
            quotechar='"', quoting=csv.QUOTE_ALL
        )
        csv_writer.writerow( NAMES )
        csv_writer.writerows( pdb_table )
        str_io.seek(0)
        return send_file(
            str_io,
            attachment_filename="mppd_query_%s.csv" % today,
            as_attachment=True
        )
    else:
        return json.dumps( collections.OrderedDict({
            "start": int( request.args.get('start', 0) ),
            "hits": count,
            "names": NAMES,
            "results": pdb_table,
            "retrieved": today
        }))


@app.route('/download/<string:pdb_id>')
def download(pdb_id):
    fp = tempfile.NamedTemporaryFile( "w+b" )
    datapath = os.path.join( app.config["DATA_FOLDER"], pdb_id )
    with zipfile.ZipFile(fp, 'w', zipfile.ZIP_DEFLATED) as fzip:
        fzip.write( 
            os.path.join( datapath, 'final.pdb' ),
            '%s_water.pdb' % pdb_id
        )
        fzip.write( 
            os.path.join( datapath, 'voronoia_fin', 'final.vol.atmprop' ),
            '%s_packdens.csv' % pdb_id
        )
        fzip.writestr(
            '%s_info.json' % pdb_id,
            'TODO'
        )
        cav_dir = os.path.join( datapath, "msms_vdw_fin" )
        if os.path.isdir( cav_dir ):
            for fname in sorted( os.listdir( cav_dir ) ):
                fzip.write( 
                    os.path.join( cav_dir, fname ),
                    os.path.join( "cavities", os.path.basename( fname ) )
                )
        fzip.writestr(
            "README.txt",
            (
                '%(pdb_id)s_water.pdb: '
                    'PDB file including the structure and '
                    'all found water molecules.\n\n'
                '%(pdb_id)s_packdens.csv: '
                    'CSV file including the atomic packing density values.\n\n'
                '%(pdb_id)s_info.json: '
                    'JSON file including the MPPD database entry. '
                    'TODO, statistics & mata data\n\n'
                'cavities: A folder containing the vertices (.vert) and '
                    'and faces (.face) of each cavity in MSMS format. '
                    'A description of the format can be found at '
                    'http://www.scripps.edu/~sanner/html/msms_man.html. '
                    '(Note: the folder is missing when there are no cavities.)'
                '' % { "pdb_id": pdb_id }
            )
        )
    return send_file(
        fp.name,
        attachment_filename="%s_mppd.zip" % pdb_id,
        as_attachment=True
    )





############################
# helper
############################

class UnicodeCsvWriter:
    """
    A CSV writer which will write rows to CSV file "f",
    which is encoded in the given encoding.
    """
    def __init__(self, f, dialect=csv.excel, encoding="utf-8", **kwds):
        # Redirect output to a queue
        self.queue = StringIO()
        self.writer = csv.writer(self.queue, dialect=dialect, **kwds)
        self.stream = f
        self.encoder = codecs.getincrementalencoder(encoding)()
    def writerow(self, row):
        self.writer.writerow([unicode(s).encode("utf-8") for s in row])
        # Fetch UTF-8 output from the queue ...
        data = self.queue.getvalue()
        data = data.decode("utf-8")
        # ... and reencode it into the target encoding
        data = self.encoder.encode(data)
        # write to the target stream
        self.stream.write(data)
        # empty queue
        self.queue.truncate(0)
    def writerows(self, rows):
        for row in rows:
            self.writerow(row)



############################
# main
############################

if __name__ == '__main__':
    app.run( 
        debug=app.config.get('DEBUG', False),
        host=app.config.get('HOST', '127.0.0.1'),
        port=app.config.get('PORT', 4223),
        extra_files=['app.cfg']
    )



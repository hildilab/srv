#!/usr/bin/env python

import os
import re
import tempfile
import zipfile
import sqlite3
import json

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
    return nop, 0, 0

NOP = get_nop( app.config )


def read_entries(config, request, table=False):
    where = []
    pdbids = ""
    keywds = request.args.get('keywds')
    
    if keywds:
        keywds = re.split( "[\s,]+", keywds.upper() )
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
                    "mpstruc_subgroup like \'%%%s%%\' COLLATE NOCASE OR "
                    "opm_family like \'%%%s%%\' COLLATE NOCASE"
                ) % ( x, x, x ) 
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
    return URL_DIR + url_for( 'static', filename=filename )

def img_url( filename ):
    return static_url( "img/" + filename )

def js_url( filename ):
    return static_url( "js/" + filename )


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
        page=page_url, static=static_url, img=img_url, js=js_url
    )


@app.route('/static/<path:filename>')
def static(filename):
    return send_from_directory(
        os.path.join( APP_PATH, "static/" ), filename, as_attachment=True
    )


@app.route('/query', methods=['POST','GET'])
def query():
    count, pdb_table = read_entries( 
        app.config, request, table=True
    )
    return json.dumps({
        "start": int( request.args.get('start', 0) ),
        "hits": count,
        "results": pdb_table
    })


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
        cav_dir = os.path.join( datapath, "msms_vdw_fin" )
        for fname in sorted( os.listdir( cav_dir ) ):
            fzip.write( 
                os.path.join( cav_dir, fname ),
                os.path.join( "cavities", os.path.basename( fname ) )
            )
    return send_file(
        fp.name,
        attachment_filename="%s_mppd.zip" % pdb_id,
        as_attachment=True
    )






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



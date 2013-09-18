#!/usr/bin/env python
"""
#####################################################
# DMPC - Webserver Script                           #
# previous name: MPHD                               #
# http://proteinformatics.charite.de/mppd           #
#                                                   # 
# Copyright (C) 2011-2013 by                        # 
# Dominic Theune <dominic.theune@charite.de>        #
#                                                   #
# All rights reserved.                              #
# BSD license.                                      #
#####################################################
""" 

import os
import re
import tempfile
import zipfile
import sqlite3
import uuid
import json

from flask import (
    Flask, request, session, render_template, 
    send_from_directory, send_file
)


cfg_file = 'app.cfg'

app = Flask( __name__ )
app.config.from_pyfile( cfg_file )

url_dir = app.config.get("URL_PREFIX", "")
app_path = app.config.get("APP_PATH", "")
version = "3.1"



def get_paras(config):
    paras = {
        'SWfamily':[], 'OPMFamily':[], 
        'EXPDTA':[], 'Species':[], 
        'maxres':0
    }
    with sqlite3.connect( config['DATABASE'] ) as conn:
        c = conn.cursor()   

        for row in c.execute( 'SELECT DISTINCT SWfamily FROM mppddbrecord WHERE SWfamily != \'\' ORDER BY SWfamily' ):
            paras['SWfamily'].append(row[0])
        for row in c.execute('SELECT MAX(DISTINCT RESOLUTION) FROM mppddbrecord WHERE OPMFamily != \'\' AND RESOLUTION != \'NULL\' and RESOLUTION != \'NOT\' and RESOLUTION != \'\'' ):
            paras['maxres']=float(row[0])
        for row in c.execute('SELECT DISTINCT OPMFamily FROM mppddbrecord WHERE OPMFamily != \'\' ORDER BY OPMFamily'):
            paras['OPMFamily'].append(row[0])
        for row in c.execute('SELECT DISTINCT EXPDTA FROM mppddbrecord ORDER BY EXPDTA'):
            paras['EXPDTA'].append(row[0])
        for row in c.execute('SELECT DISTINCT OPMSpecies FROM mppddbrecord WHERE OPMSpecies != \'\' ORDER BY OPMSpecies'):
            paras['Species'].append(row[0])
    return paras



def get_nop(config):
    with sqlite3.connect( config['DATABASE'] ) as conn:
        c = conn.cursor()

        c.execute('SELECT COUNT(DISTINCT PDBID) FROM mppddbrecord')
        nop = c.fetchone()[0]

        c.execute('SELECT COUNT(DISTINCT PDBID) FROM mppddbrecord WHERE topic=\'polytopic\'')
        poly = c.fetchone()[0]

        c.execute('SELECT COUNT(DISTINCT PDBID) FROM mppddbrecord WHERE topic=\'bitopic\'')
        bi = c.fetchone()[0]            
    return nop, poly, bi



def read_entries(config, request, paras, table=False):
    # TODO make safe!!!
    expdta = frozenset( paras['EXPDTA'] )
    swfamily = frozenset( paras['SWfamily'] )
    nmr_methods = frozenset([
        'FIBER DIFFRACTION', 'SOLUTION NMR', 'SOLID-STATE NMR',
        'SOLUTION NMR; SOLID-STATE NMR', 'FIBER DIFFRACTION; SOLID-STATE NMR'
    ])

    methods = frozenset( request.form.getlist('methods[]') )
    minres = request.form.get('minres')
    maxres = request.form.get('maxres')
    family  = request.form.getlist('family[]')
    try: family.remove("tmpvalue")
    except: pass
    family = frozenset( family )
    pdbids = request.form.get('pdbids')
    if pdbids:
        if pdbids.startswith("Enter PDB ID(s)"):
            pdbids = None
        else:
            pdbids = re.split( "[\s,]+", pdbids )
    keywds = request.form.get('keywds')
    if keywds:
        if keywds.startswith("PDB Keyword"):
            keywds = None
        else:
            keywds = re.split( "[\s,]+", keywds.upper() )
   
    where = []

    if minres and maxres:
        res_where = "( CAST(RESOLUTION as FLOAT) BETWEEN %s AND %s)" % ( minres, maxres )
    elif minres:
        res_where = "CAST(RESOLUTION as FLOAT) >= %s" % minres
    elif maxres:
        res_where = "CAST(RESOLUTION as FLOAT) <= %s" % maxres
    else:
        res_where = ""

    if res_where:
        if nmr_methods.intersection( methods ):
            res_where += " or (RESOLUTION=\'NULL\' or RESOLUTION=\'NOT\')"
        where.append( res_where )

    if methods and methods!=expdta:
        where.append( 
            " OR ".join([ "EXPDTA = \'%s\'" % x for x in methods ])
        )

    if family and family!=swfamily:
        where.append( 
            " OR ".join([ "SWfamily = \'%s\'" % x for x in family ])
        )

    if pdbids:
        where.append( 
            " OR ".join([ 
                "PDBID = \'%s\' COLLATE NOCASE" % x for x in pdbids 
            ])
        )
   
    if keywds:
        where.append( 
            " OR ".join([ 
                (   
                    "KEYWDS like \'%%%s%%\' COLLATE NOCASE OR "
                    "SWfamily like \'%%%s%%\' COLLATE NOCASE OR "
                    "OPMFamily like \'%%%s%%\' COLLATE NOCASE"
                ) % ( x, x, x ) 
                for x in keywds 
            ])
        )
    
    if where:
        where = "WHERE (" + ( ") AND (".join( where ) ) + ")"
    else:
        where = ""

    start = int( request.args.get('start', 0) )
    limit = int( request.args.get('limit', 0) )
    limit_clause = "LIMIT %i, %i" % ( start, limit) if limit else ""

    query = (
        "SELECT DISTINCT "
            "PDBID, EXPDTA, RESOLUTION, SWfamily, OPMFamily, OPMSpecies "
        "FROM mppddbrecord "
        "" + where + " "
        "ORDER by PDBID"
        " " + limit_clause + ""
    )

    print query
    
    if table:
        pdb_table = []
        with sqlite3.connect( config['DATABASE'] ) as conn:
            c = conn.cursor()
            for row in c.execute( query ):
                pdb_table.append( row )
    else:
        pdb_table = {}
        with sqlite3.connect( config['DATABASE'] ) as conn:
            c = conn.cursor()
            for row in c.execute( query ):
                pdb_table[row[0]] = {
                    'EXPDTA':row[1], 
                    'RESOLUTION': row[2], 
                    'SWfamily': row[3], 
                    'OPMFamily':row[4], 
                    'OPMSpecies': row[5]
                }
   
    return pdb_table

def read_entries2(config, request, paras, table=False):
    # TODO make safe!!!
    expdta = frozenset( paras['EXPDTA'] )
    swfamily = frozenset( paras['SWfamily'] )
    nmr_methods = frozenset([
        'FIBER DIFFRACTION', 'SOLUTION NMR', 'SOLID-STATE NMR',
        'SOLUTION NMR; SOLID-STATE NMR', 'FIBER DIFFRACTION; SOLID-STATE NMR'
    ])

    methods = frozenset( request.form.getlist('methods[]') )
    minres = request.form.get('minres')
    maxres = request.form.get('maxres')
    family  = request.form.getlist('family[]')
    try: family.remove("tmpvalue")
    except: pass
    family = frozenset( family )
    pdbids = request.form.get('pdbids')
    if pdbids:
        if pdbids.startswith("Enter PDB ID(s)"):
            pdbids = None
        else:
            pdbids = re.split( "[\s,]+", pdbids )
    keywds = request.args.get('keywds')
    if keywds:
        if keywds.startswith("PDB Keyword"):
            keywds = None
        else:
            keywds = re.split( "[\s,]+", keywds.upper() )
   
    where = []

    if minres and maxres:
        res_where = "( CAST(RESOLUTION as FLOAT) BETWEEN %s AND %s)" % ( minres, maxres )
    elif minres:
        res_where = "CAST(RESOLUTION as FLOAT) >= %s" % minres
    elif maxres:
        res_where = "CAST(RESOLUTION as FLOAT) <= %s" % maxres
    else:
        res_where = ""

    if res_where:
        if nmr_methods.intersection( methods ):
            res_where += " or (RESOLUTION=\'NULL\' or RESOLUTION=\'NOT\')"
        where.append( res_where )

    if methods and methods!=expdta:
        where.append( 
            " OR ".join([ "EXPDTA = \'%s\'" % x for x in methods ])
        )

    if family and family!=swfamily:
        where.append( 
            " OR ".join([ "SWfamily = \'%s\'" % x for x in family ])
        )

    if keywds:
        print keywds
        pdbids = [ x for x in keywds if len(x)==4 ]
        print pdbids

    if pdbids:
        where.append( 
            " OR ".join([ 
                "PDBID = \'%s\' COLLATE NOCASE" % x for x in pdbids 
            ])
        )
   
    if keywds:
        where.append( 
            " OR ".join([ 
                (   
                    "KEYWDS like \'%%%s%%\' COLLATE NOCASE OR "
                    "SWfamily like \'%%%s%%\' COLLATE NOCASE OR "
                    "OPMFamily like \'%%%s%%\' COLLATE NOCASE"
                ) % ( x, x, x ) 
                for x in keywds 
            ])
        )
    
    if where:
        where = "WHERE (" + ( ") OR (".join( where ) ) + ")"
    else:
        where = ""

    sortby = request.args.get('sortby', 'PDBID')
    direction = request.args.get('dir', 'ASC')
    order_clause = "ORDER BY %s %s" % ( sortby, direction )

    start = int( request.args.get('start', 0) )
    limit = int( request.args.get('limit', 0) )
    limit_clause = "LIMIT %i, %i" % ( start, limit) if limit else ""

    query = (
        "SELECT DISTINCT "
            "PDBID, EXPDTA, RESOLUTION, SWfamily, OPMFamily, OPMSpecies "
        "FROM mppddbrecord "
        "" + where + ""
        " " + order_clause + ""
        " " + limit_clause + ""
    )
    query_count = (
        "SELECT DISTINCT COUNT(*) "
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



paras = get_paras( app.config )
nop = get_nop( app.config )

def render_template2( tmpl_file, **kwargs ):
    return render_template(
        tmpl_file, nop=nop, version=version, url_dir=url_dir, **kwargs
    )


@app.route('/')
def index():
    return render_template2( 'welcome.htm' )

@app.route('/go', methods=['POST','GET'])
def go():
    key = str( uuid.uuid4() )
    session.permanent_session_lifetime = 7
    session.permanent = True
    
    pdb_table = read_entries( app.config, request, paras )

    if request.method in [ 'GET', 'POST' ]:
        return render_template2(
            'results.html', key=key, status="init", files={},
            pdb_table=pdb_table, provi_url=app.config["PROVI_URL"]
        )
    else:
        return "error"


@app.route('/search/')
def search():
    return render_template2(
        'search.html', svalues=paras, lmethods=len(paras['EXPDTA'])
    )

@app.route('/query', methods=['POST','GET'])
def query():
    count, pdb_table = read_entries2( 
        app.config, request, paras, table=True
    )
    return json.dumps({
        "start": int( request.args.get('start', 0) ),
        "hits": count,
        "results": pdb_table
    })

@app.route('/grid/')
def grid():
    return render_template2( 'grid.html' )

@app.route('/refs/')
def refs():
    return render_template2( 'refs.htm' )

@app.route('/usage/')
def usage():
    return render_template2( 'usage.htm' )

@app.route('/welcome/')
def welcome():
    return render_template2( 'welcome.htm' )
 
@app.route('/faq/')
def faq():
    return render_template2( 'faq.htm' )

@app.route('/links/')
def links():
    return render_template2( 'links.htm' )

@app.route('/method/')
def method():
    return render_template2( 'method.htm' )

@app.route('/changelog/')
def changelog():
    return render_template2( 'changelog.htm' )

@app.route('/statistics/')
def statistics():
    return render_template2( 'statistics.html' )



@app.route('/statisch/<path:filename>')
def statisch(filename):
    return send_from_directory(
        os.path.join( app_path, "static/" ), filename, as_attachment=True
    )

@app.route('/images/<path:filename>')
def images(filename):
    return send_from_directory(
        os.path.join( app_path, "images/" ), filename, as_attachment=True
    )

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



(function ($) {
  /***
   * A sample AJAX data store implementation.
   */
  function MppdRemoteModel() {
    // private
    var PAGESIZE = 50;
    var data = {length: 0};
    var searchstr = "";
    var sortcol = null;
    var sortdir = 1;
    var h_request = null;
    var req = null; // ajax request

    // events
    var onDataLoading = new Slick.Event();
    var onDataLoaded = new Slick.Event();


    function init() {
    }

    function frmt( s ){
      s = String(s).toLowerCase();
      s = s.replace( /\b([a-z][0-9]+[a-z])\b/g, function( str ){
        // console.log( str );
        return String( str ).toUpperCase();
      });
      var replace_map = {
        '1h': '1H',
        '7tm': '7TM',
        'a1': 'A1',
        'a2a': 'A2A',
        'a2aar': 'A2aAR',
        'abc': 'ABC',
        'acrb': 'AcrB',
        'adp': 'ADP',
        'am2': 'AM2',
        'amp': 'AMP',
        'ar55': 'AR55',
        'arch': 'ArcH',
        'atp': 'ATP',
        'atpase': 'ATPase',
        'aqp1': 'AQP1',
        'b12': 'B12',
        'bm2': 'BM2',
        'br': 'Br',
        'bril': 'BRIL',
        'c': 'C',
        'c terminal': 'C terminal',
        'c-terminal': 'C-terminal',
        'ca': 'Ca',
        'ca2': 'Ca2',
        'cax': 'CAX',
        'ccr5': 'CCR5',
        'cl': 'Cl',
        'class b': 'class B',
        'clc': 'CLC',
        'cryo-em': 'cryo-EM',
        'cryoem': 'cryoEM',
        'cxcr1': 'CXCR1',
        'cxcr4': 'CXCR4',
        'd+qb': 'D+QB',
        'd2': 'D2',
        'd3': 'D3',
        'deltanc': 'deltaNC',
        'dmpc': 'DMPC',
        'dcpc': 'DCPC',
        'dpc': 'DPC',
        'dqaqb': 'DQAQB',
        'dsbb': 'DsbB',
        'e. coli': 'E. coli',
        'e.coli': 'E.coli',
        'erbb': 'ErbB',
        'erbb2': 'ErbB2',
        'erbb3': 'ErbB3',
        'erbb4': 'ErbB4',
        'escherichia': 'Escherichia',
        'f1': 'F1',
        'f1fo': 'F1Fo',
        'f1c10': 'F1C10',
        'fab': 'Fab',
        'fv': 'Fv',
        'g protein': 'G protein',
        'g-protein': 'G-protein',
        'gs protein': 'Gs protein',
        'gact2': 'GaCT2',
        'galpha': 'Galpha',
        'glpf': 'GlpF',
        'h': 'H',
        'h1': 'H1',
        'i': 'I',
        'ii': 'II',
        'k': 'K',
        'k2p4.1': 'K2P4.1',
        'kcsa': 'KcsA',
        'kv1.2': 'Kv1.2',
        'kvap': 'KvAP',
        'l': 'L',
        'lppg': 'LPPG',
        'm': 'M',
        'm1': 'M1',
        'm2': 'M2',
        'm3': 'M3',
        'mate': 'MATE',
        'mg': 'Mg',
        'mthk': 'MthK',
        'n terminus': 'N terminus',
        'n-terminus': 'N-terminus',
        'n/ofq': 'N/OFQ',
        'na': 'Na',
        'narghi': 'NarGHI',
        'nari': 'NarI',
        'neu': 'Neu',
        'nmr': 'NMR',
        'nogo66': 'Nogo66',
        'norm': 'NorM',
        'ph': 'pH',
        'rhodobacter': 'Rhodobacter',
        'serca': 'SERCA',
        'sds': 'SDS',
        'sopip': 'SoPIP',
        't4': 'T4',
        'tba': 'TBA',
        'tm1': 'TM1',
        'tm1_tm2': 'TM1_TM2',
        'tm2': 'TM2',
        'tm7': 'TM7',
        'tmd': 'TMD',
        'tpp': 'TPP',
        'traak': 'TRAAK',
      };
      var keys = _.keys( replace_map ).join('|')
        .replace('+', '\\+')
        .replace('.', '\\.');
      var rg = new RegExp( '\\b(' + keys + ')\\b', 'gi' );
      s = s.replace(
        rg, function(str, p1, p2, offset, sx) {
          // console.log( p1, p2, String(str).toLowerCase(), replace_map[ String(str).toLowerCase() ] );
          return replace_map[ String(str).toLowerCase() ];
        }
      );
      s = _.str.capitalize( s );
      return s;
    }

    function frmt_lst( s ){
      s = _.map( s.split(","), frmt ).join(", ");
      return s;
    }

    function frmt_lst2( s ){
      return s.split(",").join(", ");
    }

    /*"pdb_id", "pdb_title", "pdb_keywords", "pdb_experiment", "pdb_resolution",
    "opm_superfamily", "opm_family", "opm_representative",
    "mpstruc_group", "mpstruc_subgroup", "mpstruc_name"*/

    function DataItem( row ) {
      this.pdb_id = row[0];
      this.pdb_title = frmt( row[1] );
      this.pdb_keywords = frmt_lst( row[2] );
      this.pdb_experiment = frmt( row[3] );
      this.pdb_resolution = row[4]=="NOT" ? "N/A" : row[4];

      this.opm_superfamily = row[5];
      this.opm_family = row[6];
      this.opm_representative = row[7];
      this.opm_species = row[8];
      this.opm_related = frmt_lst2( row[9] );

      this.mpstruc_group = row[10];
      this.mpstruc_subgroup = row[11];
      this.mpstruc_name = row[12];
      this.mpstruc_species = row[13];
      this.mpstruc_master = row[14];
      this.mpstruc_related = frmt_lst2( row[15] );

      this.curated_representative = row[16];
      this.curated_related = frmt_lst2( row[17] );

      this.status = row[18];

      this.tm_packdens_protein_buried = row[19] ? row[19].toFixed(2) : null;
      this.tm_water_count = row[20];
      this.tm_residue_count = row[21];
      this.tm_cavity_count = row[22];
    }

    function isDataLoaded(from, to) {
      for (var i = from; i <= to; i++) {
        if (data[i] == undefined || data[i] == null) {
          return false;
        }
      }

      return true;
    }


    function clear() {
      for (var key in data) {
        delete data[key];
      }
      data.length = 0;
    }


    function ensureData(from, to) {
      if (req) {
        req.abort();
        for (var i = req.fromPage; i <= req.toPage; i++)
          data[i * PAGESIZE] = undefined;
      }

      if (from < 0) {
        from = 0;
      }

      if (data.length > 0) {
        to = Math.min(to, data.length - 1);
      }

      var fromPage = Math.floor(from / PAGESIZE);
      var toPage = Math.floor(to / PAGESIZE);

      while (data[fromPage * PAGESIZE] !== undefined && fromPage < toPage)
        fromPage++;

      while (data[toPage * PAGESIZE] !== undefined && fromPage < toPage)
        toPage--;

      if (fromPage > toPage || ((fromPage == toPage) && data[fromPage * PAGESIZE] !== undefined)) {
        // TODO:  look-ahead
        onDataLoaded.notify({from: from, to: to});
        return;
      }

      // var url = "http://api.thriftdb.com/api.hnsearch.com/items/_search?filter[fields][type][]=submission&q=" + searchstr + "&start=" + (fromPage * PAGESIZE) + "&limit=" + (((toPage - fromPage) * PAGESIZE) + PAGESIZE);

      var url = "../query?keywds=" + searchstr + "&start=" + (fromPage * PAGESIZE) + "&limit=" + (((toPage - fromPage) * PAGESIZE) + PAGESIZE);

      if (sortcol != null) {
          url += ("&sortby=" + sortcol + "&dir=" + ((sortdir > 0) ? "asc" : "desc"));
      }

      if (h_request != null) {
        clearTimeout(h_request);
      }

      h_request = setTimeout(function () {
        for (var i = fromPage; i <= toPage; i++)
          data[i * PAGESIZE] = null; // null indicates a 'requested but not available yet'

        onDataLoading.notify({from: from, to: to});

        req = $.ajax({
          url: url,
          dataType: "json",
          callbackParameter: "callback",
          cache: true,
          success: onSuccess,
          error: function () {
            onError(fromPage, toPage)
          }
        });
        req.fromPage = fromPage;
        req.toPage = toPage;
      }, 50);
    }


    function onError(fromPage, toPage) {
      console.error(
        "error loading pages " + fromPage + " to " + toPage
      );
    }

    function onSuccess(resp) {
      console.log( resp )
      var from = resp.start;
      var to = from + resp.results.length;
      data.length = resp.hits

      for (var i = 0; i < resp.results.length; i++) {
        data[from + i] = new DataItem( resp.results[i] );
        data[from + i].index = from + i;
      }

      req = null;

      onDataLoaded.notify({from: from, to: to});
    }


    function reloadData(from, to) {
      for (var i = from; i <= to; i++)
        delete data[i];

      ensureData(from, to);
    }


    function setSort(column, dir) {
      sortcol = column;
      sortdir = dir;
      clear();
    }

    function setSearch(str) {
      searchstr = str;
      clear();
    }


    init();

    return {
      // properties
      "data": data,

      // methods
      "clear": clear,
      "isDataLoaded": isDataLoaded,
      "ensureData": ensureData,
      "reloadData": reloadData,
      "setSort": setSort,
      "setSearch": setSearch,

      // events
      "onDataLoading": onDataLoading,
      "onDataLoaded": onDataLoaded
    };
  }

  // Slick.Data.RemoteModel
  $.extend(true, window, {
    Slick: { Data: { MppdRemoteModel: MppdRemoteModel } }
  });
})(jQuery);

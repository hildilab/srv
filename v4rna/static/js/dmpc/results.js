function make_table_entry(obj, methodDic, vars, new_rows, def, files){
  // obj = restable entry
  entry= new Array();
  if (def != true){
    entry.push("<span id=\'fancy\'>"+def+"</span>");
  }
  else{
    entry.push(obj.no);
  }

  entry.push("<nobr><span id=\'fancy\' style='display: inline-block;width:35px;\' >"+obj.pdbid+"</span>"+
            "<span id=\'provi\' title=\'External link to Provi\' > <a href=\'http://proteinformatics.charite.de/provi-mphd/static/html/mphd.html?example_json_url=/mphd/jsons/"+
            obj.pdbid+
            ".provi&signed=1\' target=\'_blank\'> View </a></span>\
              <span id='rcsb' title=\'External link to RCSB PDB\'> <a href=\'http://www.rcsb.org/pdb/explore/explore.do?structureId="+
            obj.pdbid+
            "\' target=\'_blank\' ><img src=\'/"+
            window.location.pathname.split('/')[1]+ "/images/pdb_favicon15x15.png\'\
              style=\'border:0;width:15px;height:15px;\'/></a></span></nobr>");
  
//<span id =\'fancy2\' title=\'The desired PDB ID\'>
  entry.push("<span id=\'fancy\' title=\'"+obj.method+"\'>"+methodDic[obj.method]+"</span>");
  entry.push("<span id=\'fancy\' title=\'"+obj.family+"\'><nobr>"+ obj.family.slice(0,39) + "</nobr></span>");
  if (obj.resolution == 0.0){
    entry.push("<span id=\'fancy\' title=\'Not Apllicable'>NA</span>");
  }
  else{
    entry.push("<span id=\'fancy\' >"+obj.resolution.toString()+"</span>");
  }
  entry.push("<span id=\'fancy\' ><input type=\'checkbox\' id=\'calcprop\' name=\'calcprop\' value=\'"+obj.pdbid+"\' checked></span>");
  entry.push("<span id=\'fancy\' >"+obj['minpr'].toString()+"</span>");

  var prstring = "";
  var costrings = new Object();

  for (var co in vars["CO"]){
    costrings[vars["CO"][co]] = "";
  }  
  //entry.push('<input type=\'checkbox\' name=\'pdbstructures[]\' value=\'' + obj.pdbid + '\' checked>');

  
  for (var pr in obj["contact"]){
    prstring +="<div id=\'fancy\' style=\'display:block;height:19px;\'>"+pr+"</div>";
    // for all cutoffs
    for (var co in obj["contact"][pr]){   
      if (obj["contact"][pr][co] == ""){
        costrings[co]+="<div style=\' style=\'display:block;height:20px;\'><input type=\'checkbox\' id=\'"+obj.pdbid+pr+"_"+co+"\' name=\'r2.0_3[]\' value=\'\' DISABLED></div>" ;
      }
       else{
        costrings[co]+="<div style=\' style=\'display:block;height:20px;\'><input type=\'checkbox\' id=\'"+obj.pdbid+pr+"_"+co+"\' name=\'r2.0_3[]\' value=\'"+obj["contact"][pr][co]+"\' checked></div>";
      }
    }
  }
  entry.push(prstring);
  for (var c in costrings){
     entry.push(costrings[c]);
  }

  for (var r in new_rows){
    if (obj[new_rows[r]] == ''){
      entry.push('<input type=\'checkbox\' name=\'' +new_rows[r]+ '[]\' value=\'\' DISABLED >')
    }
    else{
      entry.push('<input type=\'checkbox\' name=\''+new_rows[r]+'[]\' value=\''+obj[new_rows[r]]+'\' onchange=\'document.getElementById( \"'+'id'+obj[new_rows[r]]+'\").innerHTML=this.checked + \" '+new_rows[r]+'\";\' checked ><span id=\"id'+obj[new_rows[r]]+'\" style=\"display:none\">'+new_rows[r]+' true</span>'); 
    } 
  }

  return (entry);
}

function fill_table(tbs){
//alert();
  //alert(tbs[0]);

 var aoCDef = new Array();
  aoCDef = [
      { "sType": "html","bVisible": true,"sWidth":'10%',"sTitle":"pdbid",      "sClass":'cutoff nowrap fancy',   "aTargets":[ 0 ] },
      { "sType": "html","bVisible": true,"sWidth":'30%',"sTitle":"method",     "sClass":'nonpolar nowrap fancy',  "aTargets":[ 1 ] },
      { "sType": "html","bVisible": true,"sWidth":'40%',"sTitle":"family",     "sClass":'polaruncharged nowrap fancy', "aTargets":[ 2 ] },
      { "sType": "html","bVisible": true,"sWidth":'5%',"sTitle":"res",         "sClass":'polaracidic fancy', "aTargets":[ 3 ] },
      { "sType": "html","bVisible": true,"sWidth":'10%',"sTitle":"&nbsp;&nbsp;&nbsp;",         "sClass":'polaracidic fancy', "aTargets":[ 4 ] }
      
      /*,
      { "sType": "html","bVisible": true,"sWidth":'5%',"sTitle":"reason", "sClass":'polaracidic fancy', "aTargets":[ 4 ] }*/
    ];
  
  

 return {
    /*"sDom": 'RC<"clear">lfrtip',*/
    //"sDom": 'RC<"H"lfr>t<"F"iSp>',
    "sDom": '<"H"C<"clear">lfip<"clear">rt<"F"iflp<"clear">>>',
    "aaData":tbs,
    "aoColumnDefs": aoCDef, 
    "bProcessing": true,
    //"sScrollY": "400px",
    //"sDom": "frtiS",
    
    "bDeferRender": true,
    "asStripeClasses": [ 'aminoA odd small', 'aminoA even small' ],
    //"sScrollX": "100%", 
    "bScrollCollapse": false, 
    "bJQueryUI": true,
    "bPaginate": true,
    "bRetrieve": true,
    
    
    "sPaginationType": "full_numbers",
    
    "oColVis":{
        "buttonText":"Change columns",
        "aiExclude":[ 0, 1 ],
        "iOverlayFade":100,
        "sSize": "css",
        "bRestore":true,
        "sRestore":"Undo"
     },
      
     "aLengthMenu": [[10, 25, 50, 100,150,500,1000, -1], [10, 25, 50, 100,150,500,1000, "All"]],    
     "iDisplayLength": 25,
     "sEcho":1,
     //"bServerSide": true,
     "bStateSave": true,
     /*
      for (var x = 0; x< aoCDef.length; x++){
        
        var y = this.createTFoot();
        y.innerHTML += '<td>'+aoCDef[x]['sTitle']+'</td>'
      }
      */

    
    "fnDrawCallback": function(){
      $('tbody tr td span[title]', this).tooltip( {
        "delay": 0,
        "track": true,
        "fade": 250
      } );/*
      $('tr', this).dblclick( function() {
        if ( $(this).hasClass('row_selected') )
          $(this).removeClass('row_selected');
        else
          $(this).addClass('row_selected');
        } );
      $('tr', this).live('dblclick', function() {
        if ( $(this).hasClass('row_selected') )
          $(this).removeClass('row_selected');
        else
          $(this).addClass('row_selected');
        } );
      $(this).show();*/

 
    },
    "oLanguage": {
      "sSearch": "Search all columns:",
      "sLoadingRecords": "Please wait - loading..."
    },
        oSelectable: {
            idColumn: 'id'
        }    
  }
}

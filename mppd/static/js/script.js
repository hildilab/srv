

/**
 * navigation
 */

function hidebyid(element)
{
    element.style.display="none";
    alert('test');
}

function ID_display_change(elementid, value)
{
   document.getElementById(elemntid).style.display=value;
}
function change_dbHS()
{
   if (document.getElementById('dbShow').style.display=="block")
   {
      document.getElementById('dbShow').style.display="none";
      document.getElementById('dbHide').style.display="block";
      document.getElementById('dbNav').style.display="block";
   }
   else
   {
      document.getElementById('dbShow').style.display="block";
      document.getElementById('dbHide').style.display="none";
      document.getElementById('dbNav').style.display="none";
   }
}
function show_dbHS()
{
   document.getElementById('dbShow').style.display="none";
   document.getElementById('dbHide').style.display="block";
   document.getElementById('dbNav').style.display="block";

}
function hide_navHS()
{
   document.getElementById('navShow').style.display="block";
   document.getElementById('navHide').style.display="none";
   document.getElementById('homeNav').style.display="none";
}
function show_navHS()
{
   document.getElementById('navShow').style.display="none";
   document.getElementById('navHide').style.display="block";
   document.getElementById('homeNav').style.display="block";
}

function change_navHS()
{
   if (document.getElementById('navShow').style.display=="block")
   {
      document.getElementById('navShow').style.display="none";
      document.getElementById('navHide').style.display="block";
      document.getElementById('homeNav').style.display="block";
   }
   else
   {
      document.getElementById('navShow').style.display="block";
      document.getElementById('navHide').style.display="none";
      document.getElementById('homeNav').style.display="none";
   }
}



/**
 * header
 */

function writeTime()
{
   var d=new Date();

   var weekday=new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
   var monthname=new Array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");

   document.getElementById("datum").firstChild.nodeValue=weekday[d.getDay()] + " " +monthname[d.getMonth()] + " "+d.getDate() + ", "+d.getFullYear();
}
query = self.location.search;
sammlung = new Array();

if (query != '')
{
  query = query.substr(1, query.length - 1);
  query = query.replace(/%26/,'&');
  teile = query.split('&');

  for (i = 0; i < teile.length; i++)
  {
     teile[i] = teile[i].split('=');
     sammlung[teile[i][0]] = teile[i][1];
  }
}


function writect()
{
   if (sammlung['nop']!=undefined)
   {
       document.getElementById("noprotein").firstChild.nodeValue=sammlung['nop'];
   }
   else
   {    
      //document.getElementById("dateno").style.display="none";
   }

}

function start()
{
   writeTime();
   writect();
}



/**
 * Content
 */


query = self.location.search;
sammlung = new Array();
 
function checkz(val, f) {
   var field = document.main.elements[f];
   if (val == '1') 
   {
      for (i = 0; i < field.length; i++) 
      {
         field[i].checked = true;
      }
   }
   else 
   { 
       for (i = 0; i < field.length; i++) 
       {
          field[i].checked = false; 
       }
       //field[0].checked = true;
      $('#formID').submit(function(){
          $('input[type=submit]', this).removeAttr('disabled');
          
          //$('#formID').style.visibility='visible';
      });
 
   }
}
 
function checkFamilySelection()
{
   var v = document.getElementById('familySelect').value;
   var selection=false;
   if (v == "select all") selection=true;
 
   if (v != "")
   {
      for (i=0; i< document.forms['main'].elements['family[]'].length; i++)
      {
         document.forms['main'].elements['family[]'][i].checked=selection;
         if (document.forms['main'].elements['family[]'][i].value == v)
         {
            document.forms['main'].elements['family[]'][i].checked=true;        
         }
      }
   }
}
function check(field, val) {
   alert(val);
   if (val.value == " select ") 
   {
      for (i = 0; i < field.length; i++) 
      {
         field[i].checked = true;
      }
      return "deselect"; 
   }
   else 
   { 
       for (i = 0; i < field.length; i++) 
       {
          field[i].checked = false; 
       }
       field[0].checked = true;
   return " select ";
   }
}

function check_all(val, f) {
   var field = document.main.elements[f];

   if (val == '1') 
   {
      for (i = 0; i < field.length; i++) 
      {
         field[i].checked = true;

      }
      if (f == 'values[]')
      {
         document.getElementById('hbonds').checked=true; 
      }
   }
   else 
   { 
       for (i = 0; i < field.length; i++) 
       {
          field[i].checked = false; 

       }

      if (f == 'values[]')
      {
         document.getElementById('hbonds').checked=false;       
      }
   }
}

function updateSearch(){
 
   if (document.getElementById('searchType').value == "Type")
   {
      document.getElementById('typeSelectspan').style.display = "block";
      document.getElementById('familySelectspan').style.display = "none";
      document.getElementById('divKeywordsText').style.display="none";
      document.getElementById('divPDBIDsText').style.display="none";
   }
   else if (document.getElementById('searchType').value == "Family")
   {
      document.getElementById('familySelectspan').style.display = "block";
      document.getElementById('typeSelectspan').style.display = "none";
      document.getElementById('divKeywordsText').style.display="none";
      document.getElementById('divPDBIDsText').style.display="none";
   }
   else
   {
      document.getElementById('typeSelectspan').style.display = "none";
      document.getElementById('familySelectspan').style.display = "none";
      if (document.getElementById('searchType').value == "Keywords")
      {
         document.getElementById('divKeywordsText').style.display="block";
         document.getElementById('divPDBIDsText').style.display="none";
      }
      else if (document.getElementById('searchType').value == "PDBs")
      {
         document.getElementById('divPDBIDsText').style.display="block";
         document.getElementById('divKeywordsText').style.display="none";
      }
   }
 
}
 
function searchChange(value)
{
   document.getElementById('standardTitle').style.display="none";
 
   if (value == 'simple')
   {
       document.getElementById('simpleSearchOff').style.display="none";
       document.getElementById('normalSearchOff').style.display="block";
       document.getElementById('expertSearchOff').style.display="block";
 
       document.getElementById('simpleSearchOn').style.display="block";
       document.getElementById('normalSearchOn').style.display="none";
       document.getElementById('expertSearchOn').style.display="none";
 
       document.getElementById('divSimpleSearch').style.display="block";
       document.getElementById('divNormalSearch').style.display="none";
       document.getElementById('divExpertSearch').style.display="none";
 
       document.getElementById('simpleTitle').style.display="block";
       document.getElementById('normalTitle').style.display="none";
       document.getElementById('expertTitle').style.display="none";
   }
   else if (value == 'normal_old')
   {
       document.getElementById('simpleSearchOff').style.display="block";
       document.getElementById('normalSearchOff').style.display="none";
       document.getElementById('expertSearchOff').style.display="block";
 
       document.getElementById('simpleSearchOn').style.display="none";
       document.getElementById('normalSearchOn').style.display="block";
       document.getElementById('expertSearchOn').style.display="none";
 
       document.getElementById('divSimpleSearch').style.display="none";
       document.getElementById('divNormalSearch').style.display="block";
       document.getElementById('divExpertSearch').style.display="none";
 
       document.getElementById('divCharacterRow').style.display="none";
       document.getElementById('divTMHRow').style.display="none";
       document.getElementById('divContactsRow').style.display="none";
 
       document.getElementById('simpleTitle').style.display="none";
       document.getElementById('normalTitle').style.display="block";
       document.getElementById('expertTitle').style.display="none";
 
   }
   else if (value == 'normal')
   {
       document.getElementById('simpleSearchOff').style.display="block";
       document.getElementById('normalSearchOff').style.display="none";
       document.getElementById('expertSearchOff').style.display="block";
 
       document.getElementById('simpleSearchOn').style.display="none";
       document.getElementById('normalSearchOn').style.display="block";
       document.getElementById('expertSearchOn').style.display="none";
 
       document.getElementById('divSimpleSearch').style.display="none";
       document.getElementById('divNormalSearch').style.display="block";
       document.getElementById('divExpertSearch').style.display="none";
 
       document.getElementById('divCharacterRow').style.display="none";
       document.getElementById('divTMHRow').style.display="none";
       document.getElementById('divContactsRow').style.display="none";
 
       document.getElementById('simpleTitle').style.display="none";
       document.getElementById('normalTitle').style.display="block";
       document.getElementById('expertTitle').style.display="none";
 
   }
   else if (value == 'expert')
   {
       document.getElementById('simpleSearchOff').style.display="block";
       document.getElementById('normalSearchOff').style.display="block";
       document.getElementById('expertSearchOff').style.display="none";
 
       document.getElementById('simpleSearchOn').style.display="none";
       document.getElementById('normalSearchOn').style.display="none";
       document.getElementById('expertSearchOn').style.display="block";
 
 
       document.getElementById('divSimpleSearch').style.display="none";
       document.getElementById('divNormalSearch').style.display="none";
       document.getElementById('divExpertSearch').style.display="block";
 
       document.getElementById('simpleTitle').style.display="none";
       document.getElementById('normalTitle').style.display="none";
       document.getElementById('expertTitle').style.display="block";
   }
}
function normalSearchChange(value)
{
   if (value == 'char')
   {
       document.getElementById('divCharacterRow').style.display="block";
       document.getElementById('divTMHRow').style.display="none";
       document.getElementById('divContactsRow').style.display="none";
   }
   else if (value == 'tmh')
   {
       document.getElementById('divCharacterRow').style.display="none";
       document.getElementById('divTMHRow').style.display="block";
       document.getElementById('divContactsRow').style.display="none";
   }
   else if (value == 'contacts')
   {
       document.getElementById('divCharacterRow').style.display="none";
       document.getElementById('divTMHRow').style.display="none";
       document.getElementById('divContactsRow').style.display="block";
   }
}
 
if (query != '')
{
  query = query.substr(1, query.length - 1);
  query = query.replace(/%26/,'&');
  teile = query.split('&');
 
  for (i = 0; i < teile.length; i++)
  {
     teile[i] = teile[i].split('=');
     sammlung[teile[i][0]] = teile[i][1];
  }
}

 
 
 
function liActivate(x)
{
 
   
   var aType=0;
   var i=0;
 
   while (i< document.getElementsByTagName('a').length)
   {
       if (document.getElementsByTagName('a')[i].name == 'aType')
       {
           aType=i;
           i = document.getElementsByTagName('a')[i].length;
 
           
       }
       else
       {
          i++;
       }
       
   }
   for (i=0; i<3;i++)
   {   
       document.getElementsByTagName('a')[aType+i].id="";
   }
   document.getElementsByTagName('a')[aType+x].id="current";
 
}
 
function dehideTable(id)
{
 
   document.getElementById('tableContacts').style.display="none";
   document.getElementById('tableMeta').style.display="none";
   document.getElementById('tableInterhelicalFeatures').style.display="none";
   document.getElementById(id).style.display="block";
}
 
function UpdateCheck(element, v)
{
   var ok=0;
   var value=parseInt(v);
   if (element[value].checked == false)
   {
      for (i=0; i<value;i++)
      {
         if (element[i].checked==true)
         {
            ok=1;
         }
      }
      for (i=value; i<element.length;i++)
      {
         if (element[i].checked==true)
         {
            ok=1;
         }
      }
      if (ok != 1)
      {
         element[value].checked=true;
         //alert('you have to choose at least one.');
      }
   }
}

function DisableBoxes(element,v){
      for (i=0; i<element.length;i++)
      {
         element[i].disabled = v;
      }  
      
}

function isAKey(evt){
    var charCode = (evt.which) ? evt.which : event.keyCode
 
    if ((charCode != 32) && (charCode > 31 && (charCode < 44 || charCode > 122 || (charCode <96 && charCode > 90))))
        return false;
    return true;
}
 
function isNumberKey(evt){
    var charCode = (evt.which) ? evt.which : event.keyCode
 
    if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;
    return true;
}
 
// like idNumberKey except one "." is allowed

function floatCheck(value){
  alert(value);
  alert(parseFloat(value));
}
function isFloatKey(evt, elem){


    //alert(elem.value);
    //alert(evt.keyCode);
    var cCode = (evt.which) ? evt.which : event.keyCode
    if (cCode==46)
    {
        for (i=0; i<elem.value.length;i++)
        {
           if (elem.value[i]==".")
           {
               return false;
           }
        }
        if (parseFloat(elem.value)>3.5 && parseFloat(elem.value)<0.0) return false;
        return true;
    }
        
    if (cCode > 31 && (cCode < 48 || cCode > 57 ))
        return false;
    if (parseFloat(elem.value)>3.5 && parseFloat(elem.value)<0.0) return false;
    return true;
}   
 
function displayChange(id1,id2)
{
    var tmp;
    tmp = document.getElementById(id1).style.display;
    document.getElementById(id1).style.display = document.getElementById(id2).style.display;
    document.getElementById(id2).style.display=tmp;
}

function CheckAll(val, element) {

   
   if (val==true) 
   {  
      for (i = 0; i < element.length; i++) 
      {
         element[i].checked = true;
      }
   }
   else 
   { 
       for (i = 0; i < element.length; i++) 
       {
          element[i].checked = false; 
       }
       element[9].checked = true;
   }
}
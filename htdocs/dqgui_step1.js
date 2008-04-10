


//CATEGORY SELECTING/UNSELECTING FUNCTIONS ------------------------------------------------

//changeCategory is called whenever the change category drop down is touched.  It takes care of hiding/unhiding the approriate divs and then
//remoting in the data if necessary.  This works for both step 1 and 2.
function changeCategory(type, categoryId){
     var activeCategoryId=getActiveCategoryId(type);

    //Clean up the old category if it is not to be cached.
    if(cachedCategories[activeCategoryId]==false){
        purgeCategory(activeCategoryId);
    }
    //Set the active category id
    activeCategoryId=categoryId;
    setActiveCategoryId(type, categoryId);

    //Hide all the field containers for categories other than the one we are now displaying
    //can't use getElementsByName (doesn't work on divs)
    var aDivs=document.getElementsByTagName("DIV");
    for(var i=0;i<aDivs.length;i++){
        if(aDivs[i].id==type+"SelectDiv_"+activeCategoryId){
            aDivs[i].style.display="block";
        } else if (aDivs[i].id.substring(0,type.length+10)==type+"SelectDiv_"){
            aDivs[i].style.display="none";
        }
    }
    if(activeCategoryId=='none'){
        return;
    }

    //If the data is not already stored locally, fetch it from the remote page.
    if(!cachedCategories[activeCategoryId]){
        sendRemoteDataQuery("query_gui_data_loader.php?mode=fields&cat_id="+activeCategoryId+"&type="+type);
    } else if (cachedCategories[activeCategoryId] && !document.getElementById(type+"SelectDiv_"+activeCategoryId)){
        //If the data IS stored locally, but hasn't yet been loaded into this particular step, build the checkboxes without calling the remote page again.
        var fakedRemoteFieldData=new Array();
        for(var fieldId in categoryFields[activeCategoryId]){
            fakedRemoteFieldData[fieldId]=fieldData[fieldId];
        }
        loadFieldsByRemote(type, activeCategoryId, fakedRemoteFieldData, cachedCategories[activeCategoryId]);
    }
}

//purgeCategory is called when a non-cached category is no longer visible.  It destroys the data array of the category and removes the div and all the
//checkbox fields assigned to that category.
function purgeCategory(type, categoryId){
    delete categoryFields[categoryId];
    removeObject(type+"SelectDiv_"+categoryId);
}



//REMOTING FUNCTIONS -------------------------------------------------------------

//loadFieldsByRemote is called by the iframe page to load fields
function loadFieldsByRemote(type, catId, remoteFieldData, cache, fake){
    var oFieldsCell=document.getElementById(type+"SelectCell");

    //Set the cacheability flag
    cachedCategories[catId]=cache;

    //Add the remote data array to the local data array.
    fieldData=mergeArrays(fieldData,remoteFieldData);
    categoryFields[catId]=new Array();
    for(var fieldId in remoteFieldData){
        categoryFields[catId][fieldId]=fieldId;
    }

    //Create the container for the fields
    var oFieldsContainerDiv=document.createElement("DIV");
    oFieldsContainerDiv.id=type+"SelectDiv_"+catId;
    oFieldsContainerDiv.setAttribute("name", type+"SelectDiv");

    //If we are loading data from a stored query do not display the div
    if(countAA(loadingData)>0){
        oFieldsContainerDiv.style.display="none";
    } else {
        oFieldsContainerDiv.style.display="block";
    }
    oFieldsContainerDiv.style.overflow="auto";
    oFieldsContainerDiv.style.height="100%";
//    oFieldsContainerDiv.style.width=screen.availWidth-50;
    oFieldsContainerDiv.style.width="100%";

    //The check all box is only used on field selection, not on conditional selection.
    if(stepNumber!=2){
        oFieldsContainerDiv.innerHTML="<input type='checkbox' onclick='checkAllFields(this.checked)' name='checkAllCheckbox'>  <b>Check/Uncheck All</b><br>";
    }
     //Attach the fields div to the container cell.
    oFieldsCell.appendChild(oFieldsContainerDiv);

    //Create the table that will hold all the field checkboxes
    var oTable=document.createElement("TABLE");
    oTable.border=0;
    oFieldsContainerDiv.appendChild(oTable);
    var oBody=document.createElement("TBODY");
    oTable.appendChild(oBody);
    var oRow=document.createElement("TR");
    oRow.style.fontSize="80%";
    oBody.appendChild(oRow);
    var oCell=document.createElement("TD");
    oCell.setAttribute("valign","top");

    //build the checkboxes.
    var loopcounter=0;
    var currentLongestString=0;
    var cellWidth=0;
    var totalWidth=0;
    for(var i in remoteFieldData){
        //Calculate the cell sizing information so that fields don't wrap.
        if(loopcounter%8==0 && loopcounter!=0){
            cellWidth=(currentLongestString*8+30);
            totalWidth+=cellWidth+10;
            oCell.style.width=cellWidth+'px';
            oRow.appendChild(oCell);
            oCell=document.createElement("TD");
            oCell.setAttribute("valign","top");
            currentLongestString=0;
        }

        //Create the field row
        if(loopcounter%8!=0){
           var oBR=document.createElement("BR");
           oCell.appendChild(oBR);
        }

        //create the checkbox and assign the event handler
        var oCheckbox=addNewElement("INPUT", type+"SelectCheckbox", "checkbox");
        oCheckbox.id=type+"Select_"+remoteFieldData[i][0];
        oCheckbox.setAttribute("title",remoteFieldData[i][2]);
        if(stepNumber==1){
            oCheckbox.onclick=addFieldToSelected;
        }
        //Check the box off if it is already selected
        if(stepNumber==1 && selectedFields[i]){
            oCheckbox.checked=true;
        }
        oCell.appendChild(oCheckbox);

        //create the text node
        var tText=document.createTextNode(remoteFieldData[i][1]);
        oCell.appendChild(tText);
        if(remoteFieldData[i][1].length > currentLongestString){
            currentLongestString=remoteFieldData[i][1].length;
        }
        loopcounter++;
    }

    //Finalize cell and table sizing.
    cellWidth=(currentLongestString*8+30);
    totalWidth+=cellWidth+10;
    oCell.style.width=cellWidth+'px';
    oRow.appendChild(oCell);
    oTable.width=totalWidth;

}

//loadCategoriesByRemote populates the category select drop down via the remote loader page
function loadCategoriesByRemote(categories){
    categoryNames=categories;
    var selects=["fieldCategorySelect","conditionalCategorySelect"];
    for(var i in selects){
        var oFieldCategorySelect=document.getElementById(selects[i]);
        for(var cat_id in categories){
           oCategoryOption=document.createElement("OPTION");
           oCategoryOption.value=cat_id;
           oCategoryOption.appendChild(document.createTextNode(categories[cat_id]));
           oFieldCategorySelect.appendChild(oCategoryOption);
        }
    }
}



//FIELD SELECTING/UNSELECTING FUNCTIONS ------------------------------------------------

//checkAllFields adds/removes all the fields to the selected fields box
function checkAllFields(status){
   for(var fieldId in categoryFields[fieldsActiveCategoryId]){
        var oCheckbox=document.getElementById("fieldsSelect_"+fieldId);
        if(oCheckbox.checked!=status){
           oCheckbox.checked=status;
            var oNewRow=addFieldToSelected("fieldsSelect_"+fieldId, status, true);
        }
    }
    if(status==true){
//        oNewRow.scrollIntoView();
    }
}

//addFieldToSelected adds/removes a checked field to the list of selected fields
//also autobuilds the No Fields selected row, if there are no fields left
function addFieldToSelected(fieldId, status, checkall){
    //Get the field id.  If this is coming from a normal checkbox (a click event) get it from the id property.
    if(!fieldId || fieldId.type=="click"){
        var fieldId=this.id;
    }
    //strip off the field_ prefix
    var prefix=fieldId.split("_",1);
    fieldId=fieldId.substr(prefix[0].length+1);
    //If this is coming from a normal checkbox (a click event) get the status from the checked property
    if(status==null){
        var status=this.checked;
    }
    //If the box is checked then add the field
    if(status==true){
	    var coll=document.getElementsByTagName("INPUT");
	    for(var i=0; i<coll.length; i++) {
		    if(coll[i].id == prefix+"_"+fieldId) {
		    	coll[i].checked=true;
		    }
	    }

        if(selectedFieldsCount==0){
            removeObject("noFieldsSelectedRow");
        }
        //Add the field to the selectedFields array
        selectedFields[fieldId]=true;
        selectedFieldsCount++;

        //Add the row
        var oNewRow=addRow("selectedField_"+fieldId, fieldData[fieldId]);
        if(!checkall){
//            oNewRow.scrollIntoView();
        }
    } else {  //otherwise remove the field
	    var coll=document.getElementsByTagName("INPUT");
	    for(var i=0; i<coll.length; i++) {
		    if(coll[i].id == prefix+"_"+fieldId) {
		    	coll[i].checked=false;
		    }
	    }
	    removeObject("selectedField_"+fieldId, fieldData[fieldId]);
	    delete selectedFields[fieldId];
	    selectedFieldsCount--;
	    if(selectedFieldsCount==0){
	        addEmptyDataRowToSelected();
	    }
    }
    return oNewRow;
}

//addEmptyDataRowToSelected adds a row that says "no fields selected" to the fields selected box
function addEmptyDataRowToSelected(){
    oTable=document.getElementById("selectedFieldsTable");
    oTbody=getFirstTagNodeByType(oTable.firstChild, "TBODY");
    oRow=document.createElement("TR");
    oRow.id="noFieldsSelectedRow";
    oRow.style.fontSize='small';
    oTbody.appendChild(oRow);

    oCell=document.createElement("TD");
    oCell.colSpan=3;
    oCell.style.border='1px black solid';
    oCell.innerHTML='No Fields Selected';
    oRow.appendChild(oCell);
}

//Adds a row of data to the selected box.
function addRow(id, columnData){
    oTable=document.getElementById("selectedFieldsTable");
    oTbody=getFirstTagNodeByType(oTable.firstChild, "TBODY");
    newRow=document.createElement("TR");
    newRow.id=id;
    newRow.style.fontSize="80%";
    oTbody.appendChild(newRow);
    var colsize=["18%","22%","60%"];
    for(var i=0;i<3;i++){
        newCell=document.createElement("TD");
        newCell.width=colsize[i];
        if(i==0){
            newCell.appendChild(document.createTextNode(categoryNames[columnData[3]]));
        } else {
            newCell.appendChild(document.createTextNode(columnData[i]));
        }
        newCell.style.borderBottom="1px black solid";
        newRow.appendChild(newCell);
    }
    return newRow;
}

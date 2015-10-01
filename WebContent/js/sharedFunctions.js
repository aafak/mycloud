// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
//
// This program has been modified by CloudByte Inc. and is an 
// unpublished copyrighted work which is proprietary to CloudByte, Inc. 
// and is not to be reproduced or disclosed to any other person or 
// entity without prior written consent from CloudByte, Inc. in 
// each and every instance.

var g_mySession = null;
var g_sessionKey = null;
var g_role = null; // roles - root, domain-admin, ro-admin, user
var g_username = null;
var g_account = null;
var g_domainid = null;
var g_enableLogging = false;
var g_timezoneoffset = null;
var g_timezone = null;
var g_supportELB = null;
var g_userPublicTemplateEnabled = "true";
var g_ssoEnabled = false;

//keyboard keycode
var keycode_Enter = 13;

//XMLHttpResponse.status
var ERROR_ACCESS_DENIED_DUE_TO_UNAUTHORIZED = 401;
var ERROR_INTERNET_NAME_NOT_RESOLVED = 12007;
var ERROR_INTERNET_CANNOT_CONNECT = 12029;
var ERROR_VMOPS_ACCOUNT_ERROR = 531;

// Default password is MD5 hashed.  Set the following variable to false to disable this.
var md5Hashed = true;
var md5HashedLogin = true;

//page size for API call (e.g."listXXXXXXX&pagesize=N" )
var pageSize = 20;

var rootAccountId = 1;
var havingSwift = false;

//async action
var oldmsg = "";
var msgbuffer = null;

var pollAsyncJobResult = function(args) {
	
  $.ajax({
    url: createURL("queryAsyncJobResult&jobId=" + args._custom.jobId),
    dataType: "json",
    async: false,
    success: function(json) {
      var area;
      var result = json.queryasyncjobresultresponse;
     // alert("Info: "+result.msg+"\npercent completed: "+result.jobprocstatus);
      if(args._custom.rowId) {
    	  var $row = $("#browser " + args._custom.msgparentelement + " tbody tr." + args._custom.rowId) ;
    	  area = $row.find(args._custom.msgchildelement);
      }else if(args._custom.widget){
    	  //add pulse animation.
    	  var $actionTasks = $("#browser").find('div.'+args._custom.widget+' div.'+args._custom.msgparentelement);
    	  var $ham = $actionTasks.find('span.hamburger');
    	  var $pulseArea =  $ham.find('i.cb-menu');
    	  if(!$pulseArea.hasClass('pulse')){
    		  $pulseArea.addClass('pulse');
    		  var $manage = $actionTasks.find('div.manage');
    		  var $ul = $('<ul><span>Status</span><li class=app-bar><div></div></li></ul>').addClass('status');
    		  var $li = $('<li>').addClass('progress');
    		  $li.appendTo($ul);
    		  $('<a href=#>').addClass('content button').appendTo($li);
    		  $ul.appendTo($manage);
    		  $ham.click();
    	  }
	  		  area = $actionTasks.find('ul.status li a');
    	  }
      else {
    	  area = $(args._custom.msgparentelement+" "+args._custom.msgchildelement);  
      }
      
      if(msgbuffer == null || msgbuffer == "")
       {
    	 msgbuffer = $('<div>');
       }
      
       if(result.msg != oldmsg && result.msg != ""){
      	 var $msg = $('<p>').addClass('new-message').append(result.msg);
      	 if($msg.text().length){
      		 if(args._custom.replace)	msgbuffer.empty();
      		 if(msgbuffer.children() && msgbuffer.children().length > 4){
      		 	$.each(msgbuffer.children(), function(ind, elem){
      		 		if(msgbuffer.children().length <= 4){
      		 			return false;
      		 		}
      		 		elem.remove();
      		 	} );
      		 }
      		 if(msgbuffer.find('p.new-message').size())	msgbuffer.find('p.new-message').removeClass('new-message');
      	   msgbuffer.find('span.loading').removeClass('loading').addClass('loaded');
      	   msgbuffer.append($('<span>').addClass("icon loading"));
      	   msgbuffer.append($msg);
      	   area.empty().append(msgbuffer);
      	   oldmsg = result.msg;
      	 }
  }
      //area.show();
      if (result.jobstatus == 0) {
    	  
        return; //Job has not completed
      } 
      else {
        if (result.jobstatus == 1) { 
        	// Succeeded
        	//alert("completedd>>>");
        	msgbuffer=null;
        	oldmsg = "";
        	//Message to be displayed as notification.
        	var notifyMsg = "";
        	if( args._custom.message ) { notifyMsg = $.isFunction( args._custom.message ) ? args._custom.message( result ) : args._custom.message ; }
          if(args._custom.getUpdatedItem != null && args._custom.getActionFilter != null) {
            args.complete({
              data: args._custom.getUpdatedItem(json),
              message: notifyMsg,
              actionFilter: args._custom.getActionFilter()
            });
          }
          else if(args._custom.getUpdatedItem != null && args._custom.getActionFilter == null) {
            args.complete({
              data: args._custom.getUpdatedItem(json),
              message: notifyMsg
            });
          }
          else {
            args.complete({ data: json.queryasyncjobresultresponse.jobresult,
            	message: notifyMsg 
            });
          }
										
          if(args._custom.fullRefreshAfterComplete == true) {
        	  setTimeout(function() {
        		  $(window).trigger('cloudStack.fullRefresh');
        	  }, 500);
          }

          if (args._custom.onComplete) {
        	  args._custom.onComplete(json, args._custom);
          }
        }
        else if (result.jobstatus == 2) { // Failed
          var $tr = $('.list-view:visible').find('table tr.'+args._custom.rowId);
          var $tdElem = $tr.find('div.remove span');
          $tdElem.removeClass('icon_progress');
          $tdElem.addClass('icon');
          msgbuffer="";
          oldmsg = "";
          var msg = (result.jobresult.errortext == null)? "": result.jobresult.errortext;
//          if(msg.indexOf("SUGGEST_FORCE_DELETE")!=-1)
//        	  args._custom.onError(msg);
//          else if(msg.indexOf("Wait while another Storage Volume on the same controller is being deleted.")!=-1)
//        	  args._custom.onError(msg);
//          else if(msg.indexOf("Has_Sub_FS")!=-1)
//        	  args._custom.onError(msg);
//          else
//        	  args.error({message: msg});
          if(args._custom.onError)
            args._custom.onError(msg);
          else
        	args.error({message: msg}); 
          args.complete({ data: json.queryasyncjobresultresponse.jobresult, status: 2 });          
        }
      }
    },
    error: function(XMLHttpResponse) {
      args.error();
    }
  });
}

//API calls
function createURL(apiName, options) {
  if (!options) options = {};
  var urlString = clientApiUrl + "?" + "command=" + apiName +"&response=json";
  
  if ( g_ssoEnabled && g_apiKey != "null") {
    urlString += "&apiKey="+ g_apiKey + "&ssoKey="+ g_ssoKey;
  } else {
    urlString += "&sessionkey="+ g_sessionKey;
  }
  
  return urlString;
}

/*
function fromdb(val) {
  return sanitizeXSS(noNull(val));
}
*/

function todb(val) {
  return encodeURIComponent(val);
}

/*
function noNull(val) {
  if(val == null)
    return "";
  else
    return val;
}
*/

/*
function sanitizeXSS(val) {  // Prevent cross-site-script(XSS) attack
  if(val == null || typeof(val) != "string")
    return val;
  val = val.replace(/</g, "&lt;");  //replace < whose unicode is \u003c
  val = val.replace(/>/g, "&gt;");  //replace > whose unicode is \u003e
  return unescape(val);
}
*/
/*
function isLicenseDel(args) {  
	var array1 = [];
    array1.push("&keyword=true");
	$.ajax({
    url: createURL("viewLicense&page="  + array1.join("")),
    data: {
      id: args.context[objType].id,
      sortKey: args.index
    },
    success: function(json) {
    	
        selectedLicenseObj = json.viewLicenseFileResponse.listLicense[0];
   $.extend( args.data, { viewLicenseData : json.viewLicenseFileResponse.listLicense[0] } );

  	  var faObj =selectedLicenseObj.featureallowed.split(",");
      	 $.each(faObj,function(key,val){
      		var obj=val.split("=");
      		$.each(obj,function(key1,val1){
      			 if(val1=="TRIAL"){
          			return true;
      			 }
      			 if(val1=="DLGADMN"){
      				 if(obj[1]==1){
      					 return true;
      				 }
      				 else{
      					 return false;
      				 }

      			 }
      			 
      		});
      	 });
       
  	

        args.response.success( resp );
        return true;
  },
    error: function(json) {
      args.response.error(parseXMLHttpResponse(json));
    }
  });
	return true;
}*/

// Role Functions
function isAdmin() {
  return (g_role == 1);
}

function isSuperAdmin() {
  return (g_role == 1);
}

function isDomainAdmin() {
  return (g_role == 2);
}

function isSiteAdmin() {
	  return (g_role == 2);
}
function isClusterAdmin() {
	  return (g_role == 4);
}
function isViewAdmin() {
	  return (g_role == 8);
}
function isAccountSuperAdmin() {
	  return (g_role == 16);
}

function isAccountAdmin() {
	  return (g_role == 32);
}

function isUser() {
  return (g_role == 0);
}

function isReadOnly() {
	if ( g_role == 32 || g_role == 8 ) return true;
	return false;
}

function isSSOEnabled() {
	return (g_apiKey != "null");
}

function isFcEnabled() {
	if (cloudStack.fcEnabled && cloudStack.fcEnabled == "false")
		return false;

	return true;
}

function isQoSConsoleOptionEnabled() {
	if (cloudStack.enableQoSConsoleOption && cloudStack.enableQoSConsoleOption == "false")
		return false;
	return true;
}

function isPoolMetaVdevOptionEnabled() {
	if (cloudStack.enablePoolMetaVdevOption && cloudStack.enablePoolMetaVdevOption == "false")
		return false;
	return true;
}
function isPoolL2ARCOptionEnabled() {
	if (cloudStack.enablePoolL2ARCOption && cloudStack.enablePoolL2ARCOption == "false")
		return false;
	return true;
}

function isUncontrolledIopsAllowed() {
	if (cloudStack.allowUncontrolledIops && cloudStack.allowUncontrolledIops == "false")
		return false;
	return true;
}

function ishaAdminCreationEnabled() {
	if (cloudStack.enablehaadmincreation && cloudStack.enablehaadmincreation == "false")
		return false;

	return true;
}

function isZilMirroringEnabled() {
	if (cloudStack.zilmirroring && cloudStack.zilmirroring == "false")
		return false;

	return true;
}
// FUNCTION: Handles AJAX error callbacks.  You can pass in an optional function to
// handle errors that are not already handled by this method.
function handleError(XMLHttpResponse, handleErrorCallback) {
  // User Not authenticated
  if (XMLHttpResponse.status == ERROR_ACCESS_DENIED_DUE_TO_UNAUTHORIZED) {
    $("#dialog_session_expired").dialog("open");
  }
  else if (XMLHttpResponse.status == ERROR_INTERNET_NAME_NOT_RESOLVED) {
    $("#dialog_error_internet_not_resolved").dialog("open");
  }
  else if (XMLHttpResponse.status == ERROR_INTERNET_CANNOT_CONNECT) {
    $("#dialog_error_management_server_not_accessible").dialog("open");
  }
  else if (XMLHttpResponse.status == ERROR_VMOPS_ACCOUNT_ERROR && handleErrorCallback != undefined) {
    handleErrorCallback();
  }
  else if (handleErrorCallback != undefined) {
    handleErrorCallback();
  }
  else {
    var errorMsg = parseXMLHttpResponse(XMLHttpResponse);
    $("#dialog_error").text(_s(errorMsg)).dialog("open");
  }
}

function parseXMLHttpResponse(XMLHttpResponse) {
  if(isValidJsonString(XMLHttpResponse.responseText) == false) {
    return "";
  }

  //var json = jQuery.parseJSON(XMLHttpResponse.responseText);
  var json = JSON.parse(XMLHttpResponse.responseText);
  if (json != null) {
    var property;
    for(property in json) {}
    var errorObj = json[property];		
		if(errorObj.errorcode == 401 && errorObj.errortext == "unable to verify user credentials and/or request signature") {
		  return _l('label.session.expired');
                }
		else
      return _s(errorObj.errortext);
  } 
	else {
    return "";
  }
}

function parseXMLHttpResponseWithField(XMLHttpResponse, field) {
	  if(isValidJsonString(XMLHttpResponse.responseText) == false) {
	    return null;
	  }

	  var json = JSON.parse(XMLHttpResponse.responseText);
	  if (json != null) {
		 var property;
		 for(property in json) {}
		    var jsonObj = json[property];
		  
		  if(jsonObj[field] != null){
			  return jsonObj[field];
		  }else {
			  return null;
		  }
	  }
}

function isValidJsonString(str) {
  try {
    JSON.parse(str);
  }
  catch (e) {
    return false;
  }
  return true;
}

cloudStack.validate = {
  vmHostName: function(args) {	  	
		// 1 ~ 63 characters long 
		// ASCII letters 'a' through 'z', 'A' through 'Z', digits '0' through '9', hyphen ('-') 
		// must start with a letter 
		// must end with a letter or a digit (must not end with a hyphen)
		var regexp = /^[a-zA-Z]{1}[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]{0,1}$/;
    var b = regexp.test(args); //true or false		
		if(b == false)
	    cloudStack.dialog.notice({ message: 'message.validate.instance.name' });	
	  return b;
	}
}

cloudStack.preFilter = {
  createTemplate: function(args) {
    if(isAdmin()) {
      args.$form.find('.form-item[rel=isPublic]').css('display', 'inline-block');
      args.$form.find('.form-item[rel=isFeatured]').css('display', 'inline-block');
    }
    else if(isSiteAdmin()){
      if (g_userPublicTemplateEnabled == "true") {
        args.$form.find('.form-item[rel=isPublic]').css('display', 'inline-block');
      }
      else {
        args.$form.find('.form-item[rel=isPublic]').hide();
      }
      args.$form.find('.form-item[rel=isFeatured]').hide();
    }
    else if(isAccountSuperAdmin()){
        if (g_userPublicTemplateEnabled == "true") {
          args.$form.find('.form-item[rel=isPublic]').css('display', 'inline-block');
        }
        else {
          args.$form.find('.form-item[rel=isPublic]').hide();
        }
        args.$form.find('.form-item[rel=isFeatured]').hide();
      }
    else if(isAccountAdmin()){
        if (g_userPublicTemplateEnabled == "true") {
          args.$form.find('.form-item[rel=isPublic]').css('display', 'inline-block');
        }
        else {
          args.$form.find('.form-item[rel=isPublic]').hide();
        }
        args.$form.find('.form-item[rel=isFeatured]').hide();
      }
  },
	addLoadBalancerDevice: function(args) { //add netscaler device OR add F5 device	  
		args.$form.find('.form-item[rel=dedicated]').bind('change', function() { 		  
			var $dedicated = args.$form.find('.form-item[rel=dedicated]');
			var $capacity = args.$form.find('.form-item[rel=capacity]');											
			if($dedicated.find('input[type=checkbox]:checked').length > 0) {												
				$capacity.hide();
				$capacity.find('input[type=text]').val('1');
			}
			else if($dedicated.find('input[type=checkbox]:unchecked').length > 0) {
				$capacity.css('display', 'inline-block');
				$capacity.find('input[type=text]').val('');												
			}			
		});			
		args.$form.change();		
	}	
}

cloudStack.actionFilter = {
  guestNetwork: function(args) {    
    var jsonObj = args.context.item;
		var allowedActions = [];

    if (!isAdmin()) {
      return [];
    }

		if(jsonObj.type == 'Isolated') {
		  allowedActions.push('edit');		//only Isolated network can be upgraded
		}
		
		allowedActions.push('restart');   
		allowedActions.push('remove');
		
		return allowedActions;
	}
};

var roleTypeUser = "0";
var roleTypeAdmin = "1";
var roleTypeDomainAdmin = "2";

cloudStack.graphColors = [
	    '0080C0',
	    '008040',
	    '808080',
	    '800080',
	    'FF8040',
	    'FFFF00',
	    'FF0080'
	];

cloudStack.storageColors = {
    'used' : '109618', //Green
    'backup-used' : 'CC9900', //Green
    'required' : 'FF9900', //Orange
    'available' : '3366CC' //Blue

};

cloudStack.iopsColors = {
    'used' : '6AB235', //Green
    'available' : 'DDDDDD', //Lighter Grey
    'read' : '6AB235',
    'write' : '0099FF'
};

cloudStack.capacityColors = {
	    'used' : '0033CC', //Blue
	    'available' : 'DDDDDD', //Lighter Grey
	    'provisioned' : '33CCCC' //Light Blue
	};

cloudStack.alertStatusColors = { 
    "unknown": "000000", 
    "normal" : "167324" , 
    "info" : "0568A6", 
    "warning" : "F2BB13", 
    "major" : "D96C0D" , 
    "critical" : "A60303" 
};

cloudStack.graphFns = {
		chartNoData : "The graph is loading...\n(This takes around five minutes, after creating\nthe Storage Volume).",
		chartNoDataSuperAdmin : "The graph is loading...\n(This takes around five minutes, after creating\nthe Storage Volume, unless you have changed the\ndefault value for monitor.qos.stats.interval in\nGlobal Settings).",
		graphHeaderProperties : function ( args ) {
            var dataXML = "divlinecolor='F47E00' " +
            	"lineThickness='3' numdivlines='4' numVDivLines='29' vDivLineAlpha='10' " + 
            	"palette='2'  plotGradientColor='' divLineAlpha='10' divLineThickness='1' " +
            	"canvasBgAngle='0' showBorder='0' canvasBorderThickness='1' canvasBgColor='FFFFFF' bgColor='FFFFFF' " +
            	"showNames='0' " ;
            return dataXML;
		},
		datasetHeader : function( args ) {
			var dataXML = "";
            dataXML +=  " showValues='0'";
            dataXML +=  " areaAlpha='50'";
            dataXML +=  " showAreaBorder='1'"; 
            if ( args.color ) {
                dataXML +=  " color='"+ args.color +"'";
                dataXML +=  " anchorBorderColor='"+ args.color +"'";
                dataXML +=  " anchorBgColor='"+ args.color +"'"; 
                dataXML +=  " areaBorderColor='"+ args.color +"'";
            }
            dataXML +=  " anchorAlpha='100'";
            dataXML +=  " anchorRadius='1'";
            dataXML +=  " areaBorderThickness='3'";
            return dataXML;
		},
		getChartNoDataText : function ( args ) {
			if ( isSuperAdmin() )
				return cloudStack.graphFns.chartNoDataSuperAdmin;
			return cloudStack.graphFns.chartNoData;
		}
};

cloudStack.converters = {
		convertIOPS: function(iops, precision, space) {
	if ( precision == undefined )
		precision = 1;
	if ( iops < 1000 ) {
		return iops;
	} else if (iops < 1000 * 1000) {
		return parseFloat( (iops / 1000).toFixed(precision) ) + ( space ? " " : "" ) + "K";
	} else if (iops < 1000 * 1000 * 1000) {
		return parseFloat( (iops / 1000 / 1000).toFixed(precision) ) + ( space ? " " : "" ) + "M";
	} else if (iops < 1000 * 1000 * 1000 * 1000) {
		return parseFloat( (iops / 1000 / 1000 / 1000).toFixed(precision) ) + ( space ? " " : "" ) + "G";
	} else {
		return parseFloat( (iops / 1000 / 1000 / 1000 / 1000 ).toFixed(precision) ) + ( space ? " " : "" ) + "T";
	}
  },
  convertBytes: function(bytes, precision, space) {
	  if ( precision == undefined )
		  precision = 2;
	  if ( bytes < 1024 * 1024 )
		  return parseFloat( ( bytes / 1024 ).toFixed( precision ) ) + ( space ? " " : "" ) + "KB";
	  else if ( bytes < 1024 * 1024 * 1024 )
		  return parseFloat( ( bytes / 1024 / 1024 ).toFixed( precision ) ) + ( space ? " " : "" ) + "MB";
	  else if ( bytes < 1024 * 1024 * 1024 * 1024 )
		  return parseFloat( ( bytes / 1024 / 1024 / 1024 ).toFixed( precision ) ) + ( space ? " " : "" ) + "GB";
	  else if ( bytes < 1024 * 1024 * 1024 * 1024 * 1024 )
		  return parseFloat( ( bytes / 1024 / 1024 / 1024 / 1024 ).toFixed( precision ) ) + ( space ? " " : "" ) + "TB";
	  else
		  return parseFloat( ( bytes / 1024 / 1024 / 1024 / 1024 / 1024 ).toFixed( precision ) ) + ( space ? " " : "" ) + "PB";
  },
  convertBits: function(bits, precision, space) {
	  if ( precision == undefined)
		  precision = 2;
	  if (bits < 1024 * 1024) {
		  return parseFloat( (bits / 1024).toFixed( precision ) ) + "Kb";
	  } else if (bits < 1024 * 1024 * 1024) {
		  return parseFloat( (bits / 1024 / 1024).toFixed( precision ) ) + "Mb";
	  } else if (bits < 1024 * 1024 * 1024 * 1024) {
		  return parseFloat( (bits / 1024 / 1024 / 1024).toFixed( precision ) ) + "Gb";
	  } else if (bits < 1024 * 1024 * 1024 * 1024 * 1024) {
		  return parseFloat( (bits / 1024 / 1024 / 1024 / 1024).toFixed(precision) ) + "Tb";
	  } else {
		  return parseFloat( (bits / 1024 / 1024 / 1024 / 1024 / 1024 ).toFixed(precision) ) + "Pb";
	  }
  },
  toLocalDate: function(UtcDate) {
	  return UtcDate;	
  },
  convertThroughputKB: function( KB, precision ) {
	  KB = ( typeof KB === "string" ) ? parseInt( KB ) : KB ;
	  return cloudStack.converters.convertBits( KB * 8 * 1024, precision ) + "ps";
  },
  toBooleanText: function(booleanValue) {
    if(booleanValue == true)
      return "Yes";
    else if(booleanValue == false)
      return "No";
  },
  convertHz: function(hz) {
    if (hz == null)
      return "";

    if (hz < 1000) {
      return hz + " MHz";
    } else {
      return (hz / 1000).toFixed(2) + " GHz";
    }
  },
  toDayOfWeekDesp: function(dayOfWeek) {
    if (dayOfWeek == "1")
      return "Sunday";
    else if (dayOfWeek == "2")
      return "Monday";
    else if (dayOfWeek == "3")
      return "Tuesday";
    else if (dayOfWeek == "4")
      return "Wednesday";
    else if (dayOfWeek == "5")
      return "Thursday";
    else if (dayOfWeek == "6")
      return "Friday";
    else if (dayOfWeek == "7")
      return "Saturday";
  },
  toDayOfWeekDesp: function(dayOfWeek) {
    if (dayOfWeek == "1")
      return "Sunday";
    else if (dayOfWeek == "2")
      return "Monday";
    else if (dayOfWeek == "3")
      return "Tuesday";
    else if (dayOfWeek == "4")
      return "Wednesday";
    else if (dayOfWeek == "5")
      return "Thursday";
    else if (dayOfWeek == "6")
      return "Friday";
    else if (dayOfWeek == "7")
      return "Saturday";
  },
  toNetworkType: function(usevirtualnetwork) {
    if(usevirtualnetwork == true || usevirtualnetwork == "true")
      return "Public";
    else
      return "Direct";
  },
  toRole: function(type) {
    if (type == roleTypeUser) {
      return "User";
    } else if (type == roleTypeAdmin) {
      return "Admin";
    } else if (type == roleTypeDomainAdmin) {
      return "Domain-Admin";
    }
  },
  toAlertType: function(alertCode) {
    switch (alertCode) {
    case 0 : return _l('label.memory');
    case 1 : return _l('label.cpu');
    case 2 : return _l('label.storage');
    case 3 : return _l('label.primary.storage');
    case 4 : return _l('label.public.ips');
    case 5 : return _l('label.management.ips');
    case 6 : return _l('label.secondary.storage');
    case 7 : return _l('label.vlan');
    case 8 : return _l('label.direct.ips');
    case 9 : return _l('label.local.storage');

    // These are old values -- can be removed in the future 
    case 10 : return "Routing Host";
    case 11 : return "Storage";
    case 12 : return "Usage Server";
    case 13 : return "Management Server";
    case 14 : return "Domain Router";
    case 15 : return "Console Proxy";
    case 16 : return "User VM";
    case 17 : return "VLAN";
    case 18 : return "Secondary Storage VM";
    }
  },
  convertByType: function(alertCode, value) {
    switch(alertCode) {
      case 0: return cloudStack.converters.convertBytes(value);
      case 1: return cloudStack.converters.convertHz(value);
      case 2: return cloudStack.converters.convertBytes(value);
      case 3: return cloudStack.converters.convertBytes(value);
      case 6: return cloudStack.converters.convertBytes(value);
      case 11: return cloudStack.converters.convertBytes(value);
    }

    return value;
  },
  alertSeverity : function(alertSeverity) {
    switch(alertSeverity) {
      case 1 : return "Error";
      case 2 : return "Critical";
      case 3 : return "Warning";
      case 4 : return "Information";
      default : return "Unknown";
    }
  }
};

var cbSiteMaxConfigured = 0;

cloudStack.resourceList = {
  sitesResourceList : function ( args ) {
    //This can be called from either dashboard or sites page.
    var resObjs = [];
    if ( !args.data ) 
        return resObjs;
    
    var siteObjs = args.data.sites ? args.data.sites : args.data
    if ( !siteObjs ) 
      return resObjs;
    
    $.each( siteObjs, function( siteIndex, siteObj ) {
      var summary = {};
      if ( !siteObj.alertstatus )
        siteObj.alertstatus = {};
      
      //TODO : This should come from backend
   	  siteObj.alertstatus.haclusters = "normal";
   	  siteObj.alertstatus.hapools = "normal";
   	  siteObj.alertstatus.tsms = "normal";
   	  siteObj.alertstatus.storage = "normal";
   	  
      var siteClusters = siteObj.haclusters ? siteObj.haclusters.length : 0;
      var sitePools = siteObj.hapools ? siteObj.hapools.length : 0;
      var siteTsms = siteObj.tsms ? siteObj.tsms.length : 0;
      
      siteObj.totalIOPS = 0;
      var availiops = 0;
      if ( sitePools > 0 ) {
    	  $.each( siteObj.hapools, function (poolI, poolObj ) {
    		  siteObj.totalIOPS += parseInt( poolObj.totaliops );
    		  availiops += parseInt( poolObj.availiops );
    	  });
      }
      siteObj.activeIOPS = 0;
      if ( siteTsms > 0 ) {
    	  siteObj.activeIOPS = siteObj.totalIOPS - availiops;
      }
      siteObj.backupIOPS = 0;
      
      //var avail = ( Math.floor((Math.random()*50)+1) );
      //var backup  = ( Math.floor((Math.random()* (( 100 - avail)/2) )+1) );
      //var used = 100 - avail - backup;
      
      //var siteClusters = 5 + Math.floor((Math.random()*5)+1);
      //var sitePools = siteClusters * 8 + Math.floor((Math.random()*10)+1);
      //var siteTsms = siteClusters * 20 + Math.floor((Math.random()*10)+1);
      
      //siteObj.currentTotalSpace = sitePools * 32000000000;
      //siteObj.currentAvailableSpace =  Math.floor (siteObj.currentTotalSpace * ( avail /100 ) );
      //siteObj.currentBackupSpace = Math.floor (siteObj.currentTotalSpace * ( backup /100 ) );
   	  //siteObj.currentUsedSpace = Math.floor (siteObj.currentTotalSpace * ( used /100 ) );
   	  
      //siteObj.currentAvailableSpace = siteObj.currentTotalSpace - siteObj.currentUsedSpace;
      //siteObj.currentBackupSpace = 0;
   	  //siteObj.currentUsedSpace = siteObj.currentTotalSpace - siteObj.currentTotalSpace * ( Math.floor((Math.random()*50)+1) /100 );
   	  
   	  
   	  //siteObj.totalIOPS = Math.floor(siteObj.currentTotalSpace / 128000000 );
   	  //siteObj.activeIOPS = Math.floor(siteObj.currentUsedSpace / 128000000 );
   	  //siteObj.backupIOPS = Math.floor(siteObj.currentBackupSpace / 128000000 );
   	  

      
      
      var msg = '';
      if ( siteClusters > 0 ) {
        $.extend( summary, { clusters : { label : 'Clusters', value : siteClusters, status : siteObj.alertstatus.haclusters } } );
        msg += siteClusters + "Cluster" + ( siteClusters > 1 ? 's' : '' );
        
        if ( sitePools > 0 ) {
          $.extend( summary, { pools : { label : 'Pools', value : sitePools, status : siteObj.alertstatus.hapools  } } );
          msg += ", " + sitePools + "Pool" + ( sitePools > 1 ? 's' : '' );
          if ( parseInt(siteObj.totalIOPS) > parseInt(cbSiteMaxConfigured )) {
            cbSiteMaxConfigured = siteObj.totalIOPS; 
          }          
          if ( siteTsms > 0 ) {
            $.extend( summary, { tsms : { label : 'VSMs',  value : siteTsms, status : siteObj.alertstatus.tsms } } );
            //$.extend( summary, { buckets : { label : 'Storage Buckets', value : siteTsms * 50,  status : siteObj.alertstatus.storage } });
            msg += ", " + siteTsms + "VSM" + ( siteTsms > 1 ? 's' : '' );
          } else {
            $.extend( summary, { tsms : { label : 'VSMs',  value : 0 } } );
          }
          $.extend( summary, { provisioned : { label : 'Provisioned Storage', value : cloudStack.converters.convertBytes(siteObj.currentTotalSpace * 1024 * 1024 ,0),  status : siteObj.alertstatus.storage } });
        } else {
          $.extend( summary,  { pools : { label : 'Pools', value : 0 } });
          msg += ". Click to Add Pool.";
        }
      } else {
        $.extend(  summary, { clusters :  { label : 'Clusters', value : 0 } });
        msg = 'Empty Site. Click to Add Cluster.';
      }
      resObjs.push( $.extend(true, siteObj, { /* info : msg,*/ summary : summary }) );
    });
    return resObjs;
  },
		  jbodsResourceList : function ( args ) {
		      var resObjs = [];
		      var scPorts = {};
		      
		      if ( args.data.jbods ) {
		          $.each(args.data.jbods, function (jbodIndex, jbodObj) {
		            scPorts[jbodObj.id] = {};
		            scPorts[jbodObj.id].name = jbodObj.name;
		            scPorts[jbodObj.id].type = jbodObj.type;
		            scPorts[jbodObj.id].jbodtype = jbodObj.jbodtype;
		            scPorts[jbodObj.id].rows = jbodObj.rows;
		            scPorts[jbodObj.id].cols = jbodObj.cols;
		            scPorts[jbodObj.id].id = jbodObj.id;
		            scPorts[jbodObj.id].disks = [];
		          });
		      }
		      
		      //Are there unlabled disks
		      if ( args.data.disks ) {
		        $.each( args.data.disks, function (i, diskObj ) {
		          //TODO : Check if the diskObj belongs to one of the 
		          // configured jbods. 
		          //Kludge for Demo
		          if ( ! diskObj.status && diskObj.disk )  diskObj.status =diskObj.disk;
		          if ( diskObj.jbodid && scPorts[diskObj.jbodid] ) {
		        	  if(!(diskObj.isPartitioned && diskObj.isPartitioned == "true")){
		            scPorts[diskObj.jbodid].disks.push( diskObj );
		        	  }
		            
		          } else {
		              if ( !scPorts[diskObj.bus] ) {
		                  scPorts[diskObj.bus] = {};
		                  scPorts[diskObj.bus].type = -1;
		                  scPorts[diskObj.bus].rows = -1;
		                  scPorts[diskObj.bus].cols = -1;
		                  scPorts[diskObj.bus].id = diskObj.bus;
		                  scPorts[diskObj.bus].disks = [];
		              }
		              if(!(diskObj.isPartitioned && diskObj.isPartitioned == "true")){
		              scPorts[diskObj.bus].disks.push( diskObj );
		              }
		              
		              diskObj.slot = undefined;
		          }
		          
		          diskObj.desc = "";
		          if ( diskObj.size != 'unknown' ) {
			          diskObj.desc += ( diskObj.slot ? diskObj.label : diskObj.name );
			          diskObj.desc +=  '(' + diskObj.type + '). ';
			          diskObj.desc += cloudStack.converters.convertBytes(diskObj.size * 1024 * 1024 ) + '.';
			          if ( diskObj.diskGroupType ) {
			        	  if ( diskObj.poolname ) diskObj.desc += ' Used in Pool: ' + diskObj.poolname + '.';
			        	  diskObj.desc += ' Used as ' + diskObj.diskGroupType + '.';
			          }
		          } else {
		        	  diskObj.desc +=  ' Empty.';
		          }

		        });
		      }
		      
		      if(args.data.diskpartitions){

		    	  $.each( args.data.diskpartitions, function (i, diskObj ) {
		    		  if ( diskObj.jbodid && scPorts[diskObj.jbodid] ) {
		    			  scPorts[diskObj.jbodid].disks.push( diskObj );
		    		  } else {
		    			  if ( !scPorts[diskObj.bus] ) {
		    				  scPorts[diskObj.bus] = {};
		    				  scPorts[diskObj.bus].type = -1;
		    				  scPorts[diskObj.bus].rows = -1;
		    				  scPorts[diskObj.bus].cols = -1;
		    				  scPorts[diskObj.bus].id = diskObj.bus;
		    				  scPorts[diskObj.bus].disks = [];
		    			  }
		    			  scPorts[diskObj.bus].disks.push( diskObj );
		    			  diskObj.slot = undefined;
		    		  }

		    		  diskObj.desc = "";
		    		  if ( diskObj.size != 'unknown' ) {
		    			  diskObj.desc += ( diskObj.slot ? diskObj.label : diskObj.name );
		    			  diskObj.desc +=  '(' + diskObj.type + '). ';
		    			  diskObj.desc += cloudStack.converters.convertBytes(diskObj.size * 1024 * 1024 ) + '.';
		    			  if ( diskObj.diskGroupType ) {
		    				  if ( diskObj.poolname ) diskObj.desc += ' Used in Pool: ' + diskObj.poolname + '.';
		    				  diskObj.desc += ' Used as ' + diskObj.diskGroupType + '.';
		    			  }
		    		  } else {
		    			  diskObj.desc +=  ' Empty.';
		    		  }

		    	  });


		      }
		      
		      $.each( scPorts, function ( scPortId, scPortObj ) {
		          resObjs.push( scPortObj );
		      });
		      
		      return resObjs;
		    },
  
  
  			nicsResourceList : function( args ){
  				
  				var resObjs = [];
  				var nicStringObj = [];
  				var count = 0;
  				if(args.data != undefined){
	  				if( args.data.nics ){
	  					
	  					$.each( args.data.nics, function ( nicIndex, nicObj ) {
	  						nicStringObj[nicIndex] = {};
	  						nicStringObj[nicIndex].name = nicObj.name;
	  						nicStringObj[nicIndex].speed = nicObj.speed;
	  						nicStringObj[nicIndex].ipAddress = nicObj.ipAddress;
	  						nicStringObj[nicIndex].macaddress = nicObj.macaddress;
	  						nicStringObj[nicIndex].vendor = nicObj.vendor;

	  						nicStringObj[nicIndex].tsmCount = nicObj.tsmCount;
	  						nicStringObj[nicIndex].nicid = nicObj.nicid;
	  						nicStringObj[nicIndex].mtu = nicObj.mtu;
	  						nicStringObj[nicIndex].status = nicObj.status;
	  						if(nicObj.subnet != 'none')
	  							nicStringObj[nicIndex].subnet = nicObj.subnet;
	  						if(nicObj.partOfLagg)
	  							nicStringObj[nicIndex].partOfLagg=nicObj.partOfLagg;
	  						if(nicObj.tsms)
	  							nicStringObj[nicIndex].tsms=nicObj.tsms;
	  						if(nicObj.mgmtif)
	  							nicStringObj[nicIndex].mgmtif=nicObj.mgmtif;
	  						if(nicObj.backupif)
	  							nicStringObj[nicIndex].backupif=nicObj.backupif;




	  						count = count + 1;
	  					});
	  					
	  				}
  				}
  				else
  					if( args.context.controller[0].nics){
  						$.each( args.context.controller[0].nics, function ( nicIndex, nicObj ) {
  	  						nicStringObj[nicIndex] = {};
  	  						nicStringObj[nicIndex].speed = nicObj.speed;
  	  						nicStringObj[nicIndex].name = nicObj.name;
  	  						nicStringObj[nicIndex].ipAddress = nicObj.ipAddress;
  	  						nicStringObj[nicIndex].macaddress = nicObj.macaddress;
  	  						nicStringObj[nicIndex].vendor = nicObj.vendor;

  	  						nicStringObj[nicIndex].tsmCount = nicObj.tsmCount;
	  						nicStringObj[nicIndex].nicid = nicObj.nicid;
	  						nicStringObj[nicIndex].mtu = nicObj.mtu;
	  						nicStringObj[nicIndex].status = nicObj.status;
	  						if(nicObj.subnet != 'none')
	  							nicStringObj[nicIndex].subnet = nicObj.subnet;
	  						if(nicObj.partOfLagg)
	  							nicStringObj[nicIndex].partOfLagg=nicObj.partOfLagg;
	  						if(nicObj.tsms)
	  							nicStringObj[nicIndex].tsms=nicObj.tsms
	  						if(nicObj.mgmtif)
	  							nicStringObj[nicIndex].mgmtif=nicObj.mgmtif;
	  						if(nicObj.backupif)
	  							nicStringObj[nicIndex].backupif=nicObj.backupif;



  	  						if(args.context.controller[0].ipAddress == nicObj.ipAddress){
  	  							var nameString = nicObj.name + "(Management)";
  	  							nicStringObj[nicIndex].description = nameString;
  	  						}
  	  						else
  	  							nicStringObj[nicIndex].description = nicObj.name;
  	  						
  	  						
  	  						count = count + 1;
  	  					});
  					}
  				
  				nicStringObj.count = count;
  				resObjs.push( nicStringObj );
  				return resObjs;
  			}
};

cloudStack.raiseNotification = function ( args ) {
  cloudStack.ui.notifications.add(
      {
        desc: args.desc,
        section: args.section
      },
      function() {}, {}, // Ignore the success args
      function() {}, {} // Ignore the error args
  );
};

var expandGraph = function( graphWidgetSection ){
	
	$('#browser').find('div').filter(function() {
		return $(this).hasClass( graphWidgetSection );
    }).find('a').find('span.link').click();
};

var fcChangeMenuSection = function ( sectionName, selObjId ) {
	if (selObjId ) {
		if ( !cloudStack.context.preSelectListRow)
            $.extend( cloudStack.context, {preSelectListRow : {} } );
        cloudStack.context.preSelectListRow[ sectionName ] = selObjId;
	}
	
	$('#smoothmenu1').find('li')
    .filter(function() {
      return $(this).hasClass( sectionName );
    })
   .click();
};

var fcChangeSection = function ( sectionName, selObjId ) {

	if(sectionName){
		if(sectionName != 'sites'){		
			$('#browser div.container div.panel').remove();
			var structuralView,command,objName ;

			if (cloudStack.context.preSelectListRow)
				delete cloudStack.context.preSelectListRow;

			switch(sectionName){
			/*case 'sites' : 
				command = 'listSite';
				objName = 'site';
				structuralView = cloudStack.sections[sectionName].centerWidgets.widgets.siteschart.resourcechart.action;
				break;*/
			case 'haCluster' :
				command = 'listHACluster';
				objName = 'hacluster';
				structuralView = cloudStack.sections[sectionName].listView.detailView;
				break;
			case 'controller' : 
				command = 'listController';
				objName = 'controller';
				structuralView = cloudStack.sections[sectionName].listView.detailView;
				break;
			case 'haPool' : 
				command = 'listHAPool';
				objName = 'hapool';
				structuralView = cloudStack.sections[sectionName].listView.detailView;
				break;
			case 'accounts' : 
				command = 'listAccount';
				objName = 'account';
				structuralView = cloudStack.sections[sectionName].listView.detailView;
				break;
			case 'tsms' : 
				command = 'listTsm';
				objName = 'listTsm';
				structuralView = cloudStack.sections[sectionName].listView.detailView;
				break;
			case 'filesystems' : 
				command = 'listFileSystem';
				objName = 'filesystem';
				structuralView = cloudStack.sections[sectionName].listView.detailView;
				break;
			}

			var data = $.extend(true, structuralView  , {
				$browser: $('#browser .container'),
				context: cloudStack.context,
				id: selObjId,
				section: sectionName
			});

			$.ajax({
				url: createURL(command+"&id="+selObjId),
				success: function(json) {
				if(command == 'listAccount2')
					command = 'listAccount';
				if(command == 'listFileSystem')
					command = 'listFilesystem';
				var selObj = json[command+'Response'];
				selObj = selObj[objName];
				data.jsonObj = selObj[0];
				data.context[sectionName] = [];
				data.context[sectionName].push(selObj[0]);
				/*cloudStack.dashboardContext.push({
					panelTitle : [data.panelTitle],
					breadCrumbSize : [1],
					data:[data]
				});*/

				var dashboardArgs  = {
						$panel : $('<div>').addClass('panel'),
						data : data,
						id : data.id,
						jsonObj : selObj[0],
						section : data.section,
						tilte : selObj[0].name,
						context: data.context,
						pageGenerator: data.pageGenerator
				};
				
				createDetailView(dashboardArgs);
				$('#navigation ul.tabs_menu').find('li.'+sectionName).siblings().removeClass('active');
				$('#navigation ul.tabs_menu').find('li.'+sectionName).addClass('active');
			},
			error: function(XMLHttpResponse) {			  		
			}
			});	
		} else {
			if (selObjId ) {
				if ( !cloudStack.context.preSelectListRow)
					$.extend( cloudStack.context, {preSelectListRow : {} } );
				cloudStack.context.preSelectListRow[ sectionName ] = selObjId;
			}
			$('#navigation').find('li')
			.filter(function() {
				return $(this).hasClass( sectionName );
			}).click();
			//$('#browser div.container').children().first().remove(); 
		}
	}
};

//find service object in network object
function ipFindNetworkServiceByName(pName, networkObj) {    
    if(networkObj == null)
        return null;
    if(networkObj.service != null) {
	    for(var i=0; i<networkObj.service.length; i++) {
	        var networkServiceObj = networkObj.service[i];
	        if(networkServiceObj.name == pName)
	            return networkServiceObj;
	    }
    }    
    return null;
}
//find capability object in service object in network object
function ipFindCapabilityByName(pName, networkServiceObj) {  
    if(networkServiceObj == null)
        return null;  
    if(networkServiceObj.capability != null) {
	    for(var i=0; i<networkServiceObj.capability.length; i++) {
	        var capabilityObj = networkServiceObj.capability[i];
	        if(capabilityObj.name == pName)
	            return capabilityObj;
	    }
    }    
    return null;
}

//compose URL for adding primary storage
function nfsURL(server, path) {
	var url;
	if(server.indexOf("://")==-1)
		url = "nfs://" + server + path;
	else
		url = server + path;
	return url;
}

function presetupURL(server, path) {
	var url;
	if(server.indexOf("://")==-1)
		url = "presetup://" + server + path;
	else
		url = server + path;
	return url;
}

function ocfs2URL(server, path) {
	var url;
	if(server.indexOf("://")==-1)
		url = "ocfs2://" + server + path;
	else
		url = server + path;
	return url;
}

function SharedMountPointURL(server, path) {
	var url;
	if(server.indexOf("://")==-1)
		url = "SharedMountPoint://" + server + path;
	else
		url = server + path;
	return url;
}

function clvmURL(vgname) {
	var url;
	if(vgname.indexOf("://")==-1)
		url = "clvm://localhost/" + vgname;
	else
		url = vgname;
	return url;
}

function vmfsURL(server, path) {
	var url;
	if(server.indexOf("://")==-1)
		url = "vmfs://" + server + path;
	else
		url = server + path;
	return url;
}

function iscsiURL(server, iqn, lun) {
	var url;
	if(server.indexOf("://")==-1)
		url = "iscsi://" + server + iqn + "/" + lun;
	else
		url = server + iqn + "/" + lun;
	return url;
}
//report funcion 
function UrlExists(url)
{
  var http = new XMLHttpRequest();
  http.open('HEAD', url, false);
  http.send();
 return http.status!=404;
}
var reportActionfilter = function(args) {
	//alert(args.context.item.status);
  var allowedActions = ['updateScheduler']; 
       allowedActions.push("download");
  if ( args.context.item.status == 'disable')
	 allowedActions.push("startScheduler");
 else
	 allowedActions.push("stopScheduler");
  	// allowedActions.push("stopScheduler");
 
   return allowedActions;
};

//VM Instance
function getVmName(p_vmName, p_vmDisplayname) {
  if(p_vmDisplayname == null)
    return _s(p_vmName);

  var vmName = null;
  if (p_vmDisplayname != p_vmName) {
    vmName = _s(p_vmName) + " (" + _s(p_vmDisplayname) + ")";
  } else {
    vmName = _s(p_vmName);
  }
  return vmName;
}

var timezoneMap = new Object();
timezoneMap['Etc/GMT+12']='[UTC-12:00] GMT-12:00';
timezoneMap['Etc/GMT+11']='[UTC-11:00] GMT-11:00';
timezoneMap['Pacific/Samoa']='[UTC-11:00] Samoa Standard Time';
timezoneMap['Pacific/Honolulu']='[UTC-10:00] Hawaii Standard Time';
timezoneMap['US/Alaska']='[UTC-09:00] Alaska Standard Time';
timezoneMap['America/Los_Angeles']='[UTC-08:00] Pacific Standard Time';
timezoneMap['Mexico/BajaNorte']='[UTC-08:00] Baja California';
timezoneMap['US/Arizona']='[UTC-07:00] Arizona';
timezoneMap['US/Mountain']='[UTC-07:00] Mountain Standard Time';
timezoneMap['America/Chihuahua']='[UTC-07:00] Chihuahua, La Paz';
timezoneMap['America/Chicago']='[UTC-06:00] Central Standard Time';
timezoneMap['America/Costa_Rica']='[UTC-06:00] Central America';
timezoneMap['America/Mexico_City']='[UTC-06:00] Mexico City, Monterrey';
timezoneMap['Canada/Saskatchewan']='[UTC-06:00] Saskatchewan';
timezoneMap['America/Bogota']='[UTC-05:00] Bogota, Lima';
timezoneMap['America/New_York']='[UTC-05:00] Eastern Standard Time';
timezoneMap['America/Caracas']='[UTC-04:00] Venezuela Time';
timezoneMap['America/Asuncion']='[UTC-04:00] Paraguay Time';
timezoneMap['America/Cuiaba']='[UTC-04:00] Amazon Time';
timezoneMap['America/Halifax']='[UTC-04:00] Atlantic Standard Time';
timezoneMap['America/La_Paz']='[UTC-04:00] Bolivia Time';
timezoneMap['America/Santiago']='[UTC-04:00] Chile Time';
timezoneMap['America/St_Johns']='[UTC-03:30] Newfoundland Standard Time';
timezoneMap['America/Araguaina']='[UTC-03:00] Brasilia Time';
timezoneMap['America/Argentina/Buenos_Aires']='[UTC-03:00] Argentine Time';
timezoneMap['America/Cayenne']='[UTC-03:00] French Guiana Time';
timezoneMap['America/Godthab']='[UTC-03:00] Greenland Time';
timezoneMap['America/Montevideo']='[UTC-03:00] Uruguay Time]';
timezoneMap['Etc/GMT+2']='[UTC-02:00] GMT-02:00';
timezoneMap['Atlantic/Azores']='[UTC-01:00] Azores Time';
timezoneMap['Atlantic/Cape_Verde']='[UTC-01:00] Cape Verde Time';
timezoneMap['Africa/Casablanca']='[UTC] Casablanca';
timezoneMap['Etc/UTC']='[UTC] Coordinated Universal Time';
timezoneMap['Atlantic/Reykjavik']='[UTC] Reykjavik';
timezoneMap['Europe/London']='[UTC] Western European Time';
timezoneMap['CET']='[UTC+01:00] Central European Time';
timezoneMap['Europe/Bucharest']='[UTC+02:00] Eastern European Time';
timezoneMap['Africa/Johannesburg']='[UTC+02:00] South Africa Standard Time';
timezoneMap['Asia/Beirut']='[UTC+02:00] Beirut';
timezoneMap['Africa/Cairo']='[UTC+02:00] Cairo';
timezoneMap['Asia/Jerusalem']='[UTC+02:00] Israel Standard Time';
timezoneMap['Europe/Minsk']='[UTC+02:00] Minsk';
timezoneMap['Europe/Moscow']='[UTC+03:00] Moscow Standard Time';
timezoneMap['Africa/Nairobi']='[UTC+03:00] Eastern African Time';
timezoneMap['Asia/Karachi']='[UTC+05:00] Pakistan Time';
timezoneMap['Asia/Kolkata']='[UTC+05:30] India Standard Time';
timezoneMap['Asia/Bangkok']='[UTC+05:30] Indochina Time';
timezoneMap['Asia/Shanghai']='[UTC+08:00] China Standard Time';
timezoneMap['Asia/Kuala_Lumpur']='[UTC+08:00] Malaysia Time';
timezoneMap['Australia/Perth']='[UTC+08:00] Western Standard Time (Australia)';
timezoneMap['Asia/Taipei']='[UTC+08:00] Taiwan';
timezoneMap['Asia/Tokyo']='[UTC+09:00] Japan Standard Time';
timezoneMap['Asia/Seoul']='[UTC+09:00] Korea Standard Time';
timezoneMap['Australia/Adelaide']='[UTC+09:30] Central Standard Time (South Australia)';
timezoneMap['Australia/Darwin']='[UTC+09:30] Central Standard Time (Northern Territory)';
timezoneMap['Australia/Brisbane']='[UTC+10:00] Eastern Standard Time (Queensland)';
timezoneMap['Australia/Canberra']='[UTC+10:00] Eastern Standard Time (New South Wales)';
timezoneMap['Pacific/Guam']='[UTC+10:00] Chamorro Standard Time';
timezoneMap['Pacific/Auckland']='[UTC+12:00] New Zealand Standard Time';

// CloudStack common API helpers
cloudStack.api = {
  actions: {
    sort: function(updateCommand, objType) {
      var action = function(args) {
        $.ajax({
          url: createURL(updateCommand),
          data: {
            id: args.context[objType].id,
            sortKey: args.index
          },
          success: function(json) {
            args.response.success();
          },
          error: function(json) {
            args.response.error(parseXMLHttpResponse(json));
          }
        });

      };

      return {
        moveTop: {
          action: action
        },
        moveBottom: {
          action: action
        },
        moveUp: {
          action: action
        },
        moveDown: {
          action: action
        },
        moveDrag: {
          action: action
        }
      }
    }
  }


};

//Declare the site selection field. This will be used by all child objects
cloudStack.siteDropDown = {
  label: 'label.site',
  desc: 'message.tooltip.select.site',
  validation: { required: true },
  select: function(args) {
    $.ajax({
      url: createURL('listSite'),
      async: false,
      data: { listAll: true },
      success: function(json) {
        var sites = json.listSiteResponse.site;
        var $form = args.$select.closest('form');
        $form.data('sites-obj', sites);
        if(!sites){
        	args.response.success({ data : {} });
        }
        else{
         args.response.success({
           data: $.map(sites, function(site) {
              return {
                id: site.id,
                description: site.name
               };
           })
          });
        }
      }
    });
  }
};

//Declare the haCluster selection field. This will be used by all child objects
cloudStack.haClusterDropDown = {
  label: 'label.ha.cluster',
  desc: 'message.tooltip.select.hacluster',
  validation: { required: true },
  select: function(args) {
	if(isAccountAdmin() || isAccountSuperAdmin() ){
		
	}
	
	else{  
     $.ajax({
       url: createURL('listHACluster'),
       data: { listAll: true },
       success: function(json) {
        var haClusters = json.listHAClusterResponse.hacluster;
        args.response.success({
          data: $.map(haClusters, function(haCluster) {
            return {
              id: haCluster.id,
              description: haCluster.name
            };
          })
        });
      }
    });
   }  
  }
};  

//Declare the controller selection field. This will be used by all child objects
cloudStack.controllerDropDown = {
  label: 'label.cd.node',
  desc: 'message.tooltip.select.controller',
  validation: { required: true },
  select: function(args) {
     if(isAccountAdmin() || isAccountSuperAdmin() ){
	 }
	 else{
      $.ajax({
       url: createURL('listController'),
       data: { listAll: true },
       success: function(json) {
        var controllers = json.listControllerResponse.controller;
        args.response.success({
          data: $.map(controllers, function(controller) {
            return {
              id: controller.id,
              description: controller.name
            };
          })
        });
      }
    });
  }
  }
};

//AuthGroup selection field. This will be used by all child objects
cloudStack.authgroupDropDown = {
		label: 'label.authgroup1',
		desc: 'message.tooltip.select.authgroup',
		validation: {required: true},
		select: function(args){
			$.ajax({
				url: createURL('listiSCSIAuthGroup'),
				data: { listAll: true },
		        success: function(json) {
		          var authGroups = json.listiSCSIAuthGroupResponse.authgroup;
		          args.response.success({
		            data: $.map(authGroups, function(authGroup) {
		              return {
		                id: authGroup.id,
		                description: authGroup.name
		              };
		            })
		          });
		        }
			})
		}
 }  


//iscsiOptions DropDown selection field. This will be used by all child objects
cloudStack.iscsioptionsDropDown = {
		label: 'label.iscsi.options',
		desc: 'message.tooltip.select.iscsiOptions',
		validation: {required: true},
		select: function(args){
			$.ajax({
				url: createURL('listTsmiSCSIOptions'),
				data: { listAll: true },
		        success: function(json) {
		          var options = json.listTsmiSCSIOptionsResponse.tiscsioptions;
		          args.response.success({
		            data: $.map(options, function(tiscsioptions) {
		              return {
		                id: tiscsioptions.id,
		                description: tiscsioptions.name
		              };
		            })
		          });
		        }
			})
		}
 } 

//Declare the HA Pool selection field. This will be used by all child objects
cloudStack.haPoolDropDown = {
  label: 'label.hapool',
  desc: 'message.tooltip.select.hapool',
  validation: { required: true },
  select: function(args) {
    if(isAccountAdmin() || isAccountSuperAdmin() ){
	 }
	else{  
     $.ajax({
       url: createURL('listHAPool'),
       data: { listAll: true },
       success: function(json) {
        var haPools = json.listHAPoolResponse.hapool;
        args.response.success({
          data: $.map(haPools, function(haPool) {
            return {
              id: haPool.id,
              description: haPool.name
            };
          })
        });
      }
    });
   }  
  }
};  

//Declare the account selection field. This will be used by all child objects
cloudStack.accountDropDown = {
		    label: 'label.account',
		    desc: 'message.tooltip.select.account',
		    validation: { required: true },
		    select: function(args) {
		      $.ajax({
		        url: createURL('listAccount'),
		        data: { listAll: true },
		        async: false,
		        success: function(json) {
		          if ( json.listAccountResponse.account ) {
		        	  var accountss = json.listAccountResponse.account;
		        	  var $form = args.$select.closest('form');
		        	  $form.data('account-objs', accountss);
			          args.response.success({
			            data: $.map(accountss, function(accounts) {
			              return {
			                id: accounts.id,
			                description: accounts.name
			              };
			            })            
			          }); 
		          } else {
		        	  args.response.success({ data : {} });
		          }
		                                                    
		        }
		      });
		    }
		  };

//Declare the tsm selection field. This will be used by all child objects
cloudStack.tsmDropDown = {
		    label: 'label.tsm.shortname',
		    desc: 'message.tooltip.select.tsm',
		    validation: { required: true },
		    select: function(args) {
		      $.ajax({
		        url: createURL('listTsm'),
		        data: { listAll: true },
		        success: function(json) {
		          var tsms = json.listTsmResponse.listTsm;
		          args.response.success({
		            data: $.map(tsms, function(listTsm) {
		              return {
		                id: listTsm.id,
		                description: listTsm.name
		              };
		            })
		          });
		        }
		      });
		    }
		  };


//Declare the users selection field. This will be used by all child objects
cloudStack.userDropDown = {
  label: 'label.iscsiuser.user',
  desc: 'message.tooltip.select.user',
  validation: { required: true },
  select: function(args) {
  	$.ajax({
          url: createURL('listAccountUser'),
          data: { listAll: true },
          success: function(json) {
            var users = json.listusersresponse.accuser;
            args.response.success({
              data: $.map(users, function(user) {
                return {
                  id: user.id,
                  description: user.username
            };
          })
        });
      }
    });
  }
};

cloudStack.peeruserDropDown = {
		    label: 'label.iscsiuser.peeruser',
		    desc: 'message.tooltip.select.peeruser',
		    validation: { required: true },
		    select: function(args) {
		    	$.ajax({
		            url: createURL('listAccountUser'),
		            data: { listAll: true },
		            success: function(json) {
		              var users = json.listusersresponse.accuser;
		              args.response.success({
		                data: $.map(users, function(user) {
		                  return {
		                    id: user.id,
		                    description: user.username
		              };
		            })
		          });
		        }
		      });
		    }
		  };


//VolumeiscsiOptions drop down 
cloudStack.volumeiSCSIOptionsDropDown = {
		    label: 'label.iscsi.volumeoptions',
		    //desc: 'message.tooltip.select.account',
		    validation: { required: true },
		    select: function(args) {
		      $.ajax({
		        url: createURL('listVolumeiSCSIOptions'),
		        data: { listAll: true },
		        success: function(json) {
		          var volumeoptionss = json.listVolumeiSCSIOptionsResponse.viscsioptions;
		          args.response.success({
		            data: $.map(volumeoptionss, function(volumeoptions) {
		              return {
		                id: volumeoptions.id,
		                description: volumeoptions.name
		              };
		            })            
		          });                                           
		        }
		      });
		    }
		  };

// initiator group drop down
cloudStack.iscsiInitiatorDropDown = {
		    label: 'label.iscsi.initiatorgroup',
		    //desc: 'message.tooltip.select.account',
		    validation: { required: true },
		    select: function(args) {
			      $.ajax({
			        url: createURL('listiSCSIInitiator'),
			        data: { listAll: true },
			        success: function(json) {
			          var initiatorss = json.listInitiatorsResponse.initiator;
			          args.response.success({
			            data: $.map(initiatorss, function(initiators) {
			              return {
			                id: initiators.id,
			                description: initiators.name
			              };
			            })            
			          });                                           
			        }
			      });
			    }
		  };



//Declare the storage(datatset/storagebucket) selection field. This will be used by all child objects
cloudStack.storageDropDown = {
		    label: 'label.storage',
		    desc: 'message.tooltip.select.storage',
		    validation: { required: true },
		    select: function(args) {
		      $.ajax({
		        url: createURL('listStorage'),
		        data: { listAll: true },
		        success: function(json) {
		          var datasets = json.listStorageResponse.storage;
		          args.response.success({
		            data: $.map(datasets, function(dataset) {
		              return {
		                id: dataset.id,
		                description: dataset.name
		              };
		            })
		          });
		        }
		      });
		    }
		  };

//Declare the qosgroup selection field. This will be used by all child objects  
cloudStack.qosgroupDropDown = {
		    label: 'label.groupname',
		    desc: 'message.tooltip.select.qosgroup',
		    validation: { required: true },
		    select: function(args) {
		      $.ajax({
		        url: createURL('listQosGroup'),
		        data: { listAll: true },
		        success: function(json) {
		          var qosgroups = json.listQosgroupResponse.qosgroup;
		          args.response.success({
		            data: $.map(qosgroups, function(qosgroup) {
		              return {
		                id: qosgroup.id,
		                description: qosgroup.name
		              };
		            })
		          });
		        }
		      });
		    }
		  };

cloudStack.scheduleReadable = function(cron_str){
	var values = cron_str.split(" ");
	var minute = values[0], hour = values[1], day = values[2], month = values[3], week = values[4];
	var scheduleReadableStr = "Schedule value is undecipherable. Sorry...!";
	var ids = day;
    if( ids != "*" && ids.indexOf("*/") != 0 ){
      var ds = ids.split(",");
      var dsl = ds.length;
      for(var i = 0; i < dsl; i++){ ids = (i == 0) ? ( parseInt(ds[i]) + 1 ) : ( ids + "," + (parseInt(ds[i]) + 1) ) ; }
    }
	
	if(minute == '*'){
		scheduleReadableStr = 'Every minute.';
	}
	else if(minute.indexOf('*/') >= 0){
		scheduleReadableStr = 'Every '+ minute.split('/')[1] + ' minutes.';
	}
	else if(hour == '*'){
		scheduleReadableStr = 'Every hour at Minute(s):'+ minute + '.';
	}	
	else if(hour.indexOf('*/') >= 0){
		scheduleReadableStr = 'Every '+ hour.split('/')[1] + ' hours at Minute: ' + minute + '.';
	}
	else if(day == '*' && week == '*'){
		scheduleReadableStr = 'Every day at Hour(s):'+ hour + ' Minute(s):' + minute + '.';
	}
	else if(day.indexOf('*/') >= 0){
		scheduleReadableStr = 'Every '+ day.split('/')[1] + ' days at Hour:' + hour + ' Minute:' + minute + '.';
	}
	else if(week != '*'){
		var weekDays = null, weeks = '';
		if(week.indexOf(',')>=0){
			weekDays = week.split(',');
			$.each(weekDays, function(index, object){
				switch(object){
					case 'sun' : weeks += 'Sunday,'; break;
					case 'mon' : weeks += 'Monday,'; break;
					case 'tue' : weeks += 'Tuesday,'; break;
					case 'wed' : weeks += 'Wednesday,'; break;
					case 'thu' : weeks += 'Thursday,'; break;
					case 'fri' : weeks += 'Friday,'; break;
					case 'sat' : weeks += 'Saturday,'; break;
					case '0' : weeks += 'Sunday,'; break;
					case '1' : weeks += 'Monday,'; break;
					case '2' : weeks += 'Tuesday,'; break;
					case '3' : weeks += 'Wednesday,'; break;
					case '4' : weeks += 'Thursday,'; break;
					case '5' : weeks += 'Friday,'; break;
					case '6' : weeks += 'Saturday,'; break;
				}
			});
			weeks = weeks.substring(0,weeks.lastIndexOf(','));
		} else {
			switch(week){
				case 'sun' : weeks = 'Sunday'; break;
				case 'mon' : weeks = 'Monday'; break;
				case 'tue' : weeks = 'Tuesday'; break;
				case 'wed' : weeks = 'Wednesday'; break;
				case 'thu' : weeks = 'Thursday'; break;
				case 'fri' : weeks = 'Friday'; break;
				case 'sat' : weeks = 'Saturday'; break;
				case '0' : weeks = 'Sunday'; break;
				case '1' : weeks = 'Monday'; break;
				case '2' : weeks = 'Tuesday'; break;
				case '3' : weeks = 'Wednesday'; break;
				case '4' : weeks = 'Thursday'; break;
				case '5' : weeks = 'Friday'; break;
				case '6' : weeks = 'Saturday'; break;
			}
		}
		scheduleReadableStr = 'Every '+ weeks + ' at Hour(s):'+ hour + ' Minute(s):' + minute + '.';
	}
	else if(month == '*'){
		scheduleReadableStr = 'Every month on Day(s):'+ ids + ' at Hour(s):' + hour +' Minute(s):'+ minute + '.';
	}
	else if(month != '*'){
		var monthNames = '', months = null;
		if(month.indexOf(',')>=0){
			months = month.split(',');
			$.each(months, function(index, object){
				switch(object){
					case 'jan' : monthNames += 'January,'; break;
					case 'feb' : monthNames += 'February,'; break;
					case 'mar' : monthNames += 'March,'; break;
					case 'apr' : monthNames += 'April,'; break;
					case 'may' : monthNames += 'May,'; break;
					case 'jun' : monthNames += 'June,'; break;
					case 'jul' : monthNames += 'July,'; break;
					case 'aug' : monthNames += 'August,'; break;
					case 'sep' : monthNames += 'September,'; break;
					case 'oct' : monthNames += 'October,'; break;
					case 'nov' : monthNames += 'November,'; break;
					case 'dec' : monthNames += 'December,'; break;
					case '1' : monthNames += 'January,'; break;
					case '2' : monthNames += 'February,'; break;
					case '3' : monthNames += 'March,'; break;
					case '4' : monthNames += 'April,'; break;
					case '5' : monthNames += 'May,'; break;
					case '6' : monthNames += 'June,'; break;
					case '7' : monthNames += 'July,'; break;
					case '8' : monthNames += 'August,'; break;
					case '9' : monthNames += 'September,'; break;
					case '10' : monthNames += 'October,'; break;
					case '11' : monthNames += 'November,'; break;
					case '12' : monthNames += 'December,'; break;
				}				
			});
			monthNames = monthNames.substring(0,monthNames.lastIndexOf(','));
		} else {
			switch(month){
			   	case 'jan' : monthNames = 'January'; break;
				case 'feb' : monthNames = 'February'; break;
				case 'mar' : monthNames = 'March'; break;
				case 'apr' : monthNames = 'April'; break;
				case 'may' : monthNames = 'May'; break;
				case 'jun' : monthNames = 'June'; break;
				case 'jul' : monthNames = 'July'; break;
				case 'aug' : monthNames = 'August'; break;
				case 'sep' : monthNames = 'September'; break;
				case 'oct' : monthNames = 'October'; break;
				case 'nov' : monthNames = 'November'; break;
				case 'dec' : monthNames = 'December'; break;
				case '1' : monthNames = 'January'; break;
				case '2' : monthNames = 'February'; break;
				case '3' : monthNames = 'March'; break;
				case '4' : monthNames = 'April'; break;
				case '5' : monthNames = 'May'; break;
				case '6' : monthNames = 'June'; break;
				case '7' : monthNames = 'July'; break;
				case '8' : monthNames = 'August'; break;
				case '9' : monthNames = 'September'; break;
				case '10' : monthNames = 'October'; break;
				case '11' : monthNames = 'November'; break;
				case '12' : monthNames = 'December'; break;
			}
		}
		scheduleReadableStr = 'Every year in Month(s):'+ monthNames +' on Day(s):'+ ids + ' at Hour(s):' + hour +' Minute(s):'+ minute ;
	}  
	return scheduleReadableStr;
};

cloudStack.cbCronJob = function(cron_str){
	var monthmatch = function(num) {
		var month = null;
		switch(num){
			case '1' : month = 'jan'
					break;
			case '2' : month = 'feb'
					break;
			case '3' : month = 'mar'
					break;
			case '4' : month = 'apr'
					break;
			case '5' : month = 'may'
					break;
			case '6' : month = 'jun'
					break;
			case '7' : month = 'jul'
					break;
			case '8' : month = 'aug'
					break;
			case '9' : month = 'sep'
					break;
			case '10' : month = 'oct'
					break;
			case '11' : month = 'nov'
					break;
			case '12' : month = 'dec'
					break;
			default : month = '*'
					break;
		}
		return month;
	};
	var weekmatch = function(num) {
		var week = null;
		switch(num){
			case '0' : week = 'sun'
					break;
			case '1' : week = 'mon'
					break;
			case '2' : week = 'tue'
					break;
			case '3' : week = 'wed'
					break;
			case '4' : week = 'thu'
					break;
			case '5' : week = 'fri'
					break;
			case '6' : week = 'sat'
					break;
			default : week = '*'
					break;
		}
		return week;
	};
	var cronArray = cron_str.split(' ');
	var cronmonth = null, cronweek = null;
    if(cronArray[3].indexOf(',')>=0){
    	var months = cronArray[3].split(',');
    	$.each(months, function(index, object){
    		if ( cronmonth == null ) cronmonth = monthmatch(object);
    		else cronmonth += ',' + monthmatch(object);
    	});
    }
    else cronmonth = monthmatch(cronArray[3]);        
    if(cronArray[4].indexOf(',')>=0){
    	var weeks = cronArray[4].split(',');
    	$.each(weeks, function(index, object){
    		if ( cronweek == null ) cronweek = weekmatch(object);
    		else cronweek += ',' + weekmatch(object);
    	});
    }
    else cronweek = weekmatch(cronArray[4]);
	return ( cronArray[0] + " " + cronArray[1] + " " + cronArray[2] + " " + cronmonth + " " + cronweek );
};

cloudStack.encryptText = function(text) {
	var str = "";
	if(!text || text.length == 0 || text == null) {
		return str;	
	}
	if(text.length){
		for(var i = 0; i < text.length; i++)
			str += "*";
		return str;
	}
	else {
		return str;	
	}
};

//takes block size in bytes, and return in KB if it is greater than 512, in case of 0, return 4KB
cloudStack.getFormatBlockSize = function(recommendedVolBlockSize, requiredLongFormat){
	  if(recommendedVolBlockSize == 512){
		  return "512B"
	  }
	  else if(recommendedVolBlockSize == 0){
		  if(requiredLongFormat)return "4KB"
		
		 return "4k"
	  }
	  else{
		  //converting Byte to KB
		  recommendedVolBlockSize = recommendedVolBlockSize/1024
		  //Rounding the number, eg. 1.1 will be 2
		  recommendedVolBlockSize = Math.ceil(recommendedVolBlockSize.toFixed(2));
		  
		  // serach for nearest block size if recommendedVolBlockSize is not power of two, 
		  //eg. 12(in case of 4096(sector size) *3 (disks)), then it will return 16(nearest one)
		  if(! cloudStack.isPowerOfTwo(recommendedVolBlockSize)){
			  while(!cloudStack.isPowerOfTwo(recommendedVolBlockSize)){
				  recommendedVolBlockSize+=1
			  }
		  }
		  if(recommendedVolBlockSize> 128)
			  recommendedVolBlockSize = 128
			  
		  if(requiredLongFormat)return recommendedVolBlockSize+"KB"
		
		  return recommendedVolBlockSize+"k"		  
	  }
};

cloudStack.isPowerOfTwo = function(number){
	    isPowOfTwo=true;
	    while (number != 1 && number > 0){
	        if(number%2){
	            //can do return here as well
	            isPowOfTwo = false
	         }
	        number=number/2
	     }
	    return isPowOfTwo && (number > 0)
 };

 // input should be like 4k,8k, etc
 cloudStack.convertKBToByte = function(blocksize){
	 blocksize = blocksize.substring(0, blocksize.length - 1) //removes last character
	 if(blocksize == 512){
	   blocksize = parseInt(blocksize)
	 }else{
		 blocksize = parseInt(blocksize) * 1024	
	 }
	 return blocksize
};
/** Refresh options **/
//Refreshes the current page.
cloudStack.breadcrumbsRefresh = function(){
	$('#browser > .container .panel:visible li.refresh a').click();
};

/** create hierarchy **/
cloudStack.hierarchy = function(args){
	var hierarchy = {};
	hierarchy.acc = [];
	hierarchy.infra = [];
	
	if(args.section == 'account'){
		hierarchy.acc.push( {
			label : 'Account',
			value : args.context.accountname ? args.context.accountname : args.context.name,
			section : 'accounts', id: args.context.accountid ? args.context.accountid : args.context.id
		} );
		return hierarchy;
	}
	
	if( !isClusterAdmin() ){
		hierarchy.infra.push( {
			label : 'Site', 
			value : args.context.sitename ? args.context.sitename : args.context.name, 
			section : 'sites', 
			id: args.context.siteid ? args.context.siteid : args.context.id
		} );
		if(args.section == 'site'){
			return hierarchy;
		}
	}
	
	hierarchy.infra.push( {
		label : 'HA Group',
		value : args.context.clustername ? args.context.clustername : args.context.name,
		section : 'haCluster',
		id: args.context.clusterid ? args.context.clusterid : args.context.id
	} );
	if(args.section == 'cluster'){
		return hierarchy;
	}
	
	hierarchy.infra.push( {
		label : 'Node',
		value : args.context.controllerName ? args.context.controllerName : args.context.name,
		section : 'controller',
		id: args.context.controllerid ? args.context.controllerid : args.context.id 
	} );
	if(args.section == 'node'){
		return hierarchy;
	}
	
	hierarchy.infra.push( {
		label : 'Pool',
		value : args.context.hapoolname ? args.context.hapoolname : args.context.name,
		section : 'haPool',
		id: args.context.poolid ? args.context.poolid : args.context.id
	} );
	if(args.section == 'pool'){
		return hierarchy;
	}
	
	hierarchy.acc = [];
	hierarchy.acc.push( {
		label : 'Account',
		value : args.context.accountname ? args.context.accountname : args.context.name,
		section : 'account',
		id: args.context.accountid ? args.context.accountid : args.context.id
	} );
	
	hierarchy.acc.push( {
		label : 'VSM', 
		value : args.context.tsmName ? args.context.tsmName : args.context.name, 
	    section : 'tsms',
	    id: args.context.Tsmid ? args.context.Tsmid : args.context.id 
	} );
	if(args.section == 'tsm'){
		return hierarchy;
	}
	
	hierarchy.acc.push( {
		label : 'Storage Volume',
		value : args.context.name,
		section : 'filesystems',
		id: args.context.id 
	} );
	if(args.section == 'volume'){
		return hierarchy;
	}
}

/** Navigate Options **/
//Navigates to storage volumes.
cloudStack.gotoStorageVolumes = function(){
	$('#navigation').find('li')
	.filter(function() {
		return $(this).hasClass( 'filesystems' );
	})
	.click();
};
//Navigates to TSMs.
cloudStack.gotoTsms = function(){
	$('#navigation').find('li')
	.filter(function() {
		return $(this).hasClass( 'tsms' );
	})
	.click();
};
//Navigates to Nodes.
cloudStack.gotoNodes = function(){
	$('#navigation').find('li')
	.filter(function() {
		return $(this).hasClass( 'controller' );
	})
	.click();
};

//check for Disk speed
function sameSpeedDisks(diskDetails){
	var ndisks = parseInt( diskDetails.length );
	var sameSpeedDisk=true;
	
	if(ndisks >= 2){
		var firstDiskSpeed = diskDetails[0].speedInMB;
		for(i = 1;i<ndisks;i++){
			var otherDiskSpeed = diskDetails[i].speedInMB;	
			if(otherDiskSpeed != firstDiskSpeed){
				sameSpeedDisk = false; 
				i = ndisks; //breaking the loop
			}  
		} 
	} 
	return sameSpeedDisk;
}	

cloudStack.getIscsiJobdName = function(){
    return "iSCSI Disks(LUNs)";
};

cloudStack.getIscsiDiskCount = function(disks){
	diskCount = 0;
	$( disks ).each( function() {
	  var disk = this;
	  if(disk.type = 'iSCSI') {
		  diskCount++;
	  }
	});
	if(diskCount >0 && diskCount <= 9){
		diskCount = "0"+diskCount
	}
    return diskCount;
};

function log(args){

  // The logs will be visbile on the UI developer console if
  // dynamicdebug is a valid object i.e. truthy.
  // NOTE: Update below to true only in your Browser's developer console
  // Refresh the application not the Browser.
  dynamicdebug = false;

  if(dynamicdebug){
    console.log(args);
  }
}

// https://gist.github.com/FGRibreau/3655432
/**
   * Patch the console methods in order to provide timestamp information
   *
   * Usage:
   *  > console.log('ok')
   *  2012-09-06T11:52:56.769Z ok true
   *
   * Note:
   *  The patch will only be applied with the first call.
   *
   * Tested with V8 (Google Chrome & NodeJS)
   */
(function(o){
  if(o.__ts__){return;}
  var slice = Array.prototype.slice;
  ['log', 'debug', 'info', 'warn', 'error'].forEach(function(f){
    var _= o[f];
    o[f] = function(){
      var args = slice.call(arguments);
      args.unshift(new Date().toISOString());
      return _.apply(o, args);
    };
  });
  o.__ts__ = true;
})(console);

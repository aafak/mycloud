$( document ).ready(function() {

	/*listening for button click event*/
	var array1 = [];
	array1.push("userid=" + "1");
	//array1.push("password=" + "test");

	$.ajax({			
		url: '../rest/users/user?'+array1.join("&"), 
		dataType: "json",
		async: false,
		type: 'get',
		success: function(json) {
			if(json.userName) {
				$('div.content').text('user: '+json.userName);
			} 
		},
		error: function(XMLHttpResponse){
			//var errorMsg = parseXMLHttpResponse(XMLHttpResponse);
			alert(XMLHttpResponse.responseText)
		}

	}); 


});
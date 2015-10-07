$( document ).ready(function() {

	$('.login').on('click', function(){    /*listening for button click event*/
		var array1 = [];
		var username = $('input:text.username').val()
		var password = $('input:password.password').val()
		//alert("usrname: "+username+", password: "+password)

		array1.push("username=" + username);
		array1.push("password=" + password);

		$.ajax({			
			url: '../mycloud/rest/login/authenticate?'+array1.join("&"), 
			dataType: "json",
			async: false,
			type: 'post',
			success: function(json) {
				if(json.userName) {
					//alert("usrname: "+json.userName+", password: "+json.password)
					$(location).attr('href','../mycloud/webpages/home.jsp');
					//window.location("../mycloud/webpages/home.jsp");
				} else {
					alert("errorcode: "+json.errCode+", error: "+json.errMsg)
				}
			},
			error: function(XMLHttpResponse){
				//var errorMsg = parseXMLHttpResponse(XMLHttpResponse);
				alert(XMLHttpResponse.responseText)
			}

		}); 
	});

});
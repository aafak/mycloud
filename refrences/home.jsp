<!DOCTYPE html>
<html lang="en">
<title>HTML5</title>
<meta charset="utf-8">



<link rel="stylesheet" href="css/style.css">
<!--[if lt IE 9]>
<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js">
</script>
<![endif]-->

<body>

<header>
<!-- <h1>Software Defined Storage</h1> -->
</header>

<!-- JAVASCRIPT SECTION  -->
<script src="js/jquery/jquery-1.11.3.min.js"></script>

<script type="text/javascript">

		$.ajax({			
			
			url: 'rest/users/user?userid=1', //createURL("deleteTsm" + array1.join("")),
			dataType: "json",
			async: false,
			success: function(json) {
				alert("usrname: "+json.userName+", password: "+json.password)

			},
			
		});

			
   
   
   
</script>


<div class="wrapper">
    <button>Click Me</button>   <!-- content will be shown on this button click -->
    <div class="content"></div> <!-- content will be shown in this div -->
</div><footer>
<p>&copy; 2014 Monday Times. All rights reserved.</p>
</footer>

</body>
</html>


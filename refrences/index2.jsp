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
<h1>Software Defined Storage</h1>
</header>

<div class="wrapper">
    <button>Click Me</button>   <!-- content will be shown on this button click -->
    <div class="content"></div> <!-- content will be shown in this div -->
</div>

<!-- JAVASCRIPT SECTION  -->
<script src="js\jquery\jquery-1.11.3.min.js"></script>

<script type="text/javascript">
    $('button').on('click', function(){    /*listening for button click event*/
      
     $.ajax('rest/login/authenticate', {          /*specify the destination file*/
            success: function(response){    /*if ajax reaches the document successfully..*/

                $('.content').html(response);
                //$('.content').html($(response).find('img, h2').fadeIn());
                $('.content').html($(response)).fadeIn();
            },
            type: 'GET',        /*ajax is going to get data from somewhere*/
    });
    });
</script>

<form action="rest/login/authenticate" method ="post">
UserId:<input type="text" name="username">
<br/>
Password:<input type="password" name="password">
<br/>
<input type="submit" value="Login">

</form>

<footer>
<p>&copy; 2014 Monday Times. All rights reserved.</p>
</footer>

</body>
</html>


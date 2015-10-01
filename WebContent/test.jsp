<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
	<title>jQuery AJAX Example</title>
</head>
<body>
<style type="text/css">
    html {
        margin: 10em 0em 0em 10em;
    }
</style>

<!-- HTML SECTION  -->
<div class="wrapper">
    <button>Click Me</button>   <!-- content will be shown on this button click -->
    <div class="content"></div> <!-- content will be shown in this div -->
</div>

<!-- JAVASCRIPT SECTION  -->
<script src="js\jquery\jquery-1.11.3.min.js"></script>

<script type="text/javascript">
    $('button').on('click', function(){    /*listening for button click event*/
      
     $.ajax('webpages/document.html', {          /*specify the destination file*/
            success: function(response){    /*if ajax reaches the document successfully..*/

                $('.content').html(response);
                //$('.content').html($(response).find('img, h2').fadeIn());
                $('.content').html($(response)).fadeIn();
            },
            type: 'GET',        /*ajax is going to get data from somewhere*/
    });
    });
</script>

</body>
</html>



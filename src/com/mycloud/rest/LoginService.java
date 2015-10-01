package com.mycloud.rest;

import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.mycloud.user.User;

@Path("/login")
public class LoginService {

	@POST
	@Path("/authenticate")
	@Produces(MediaType.APPLICATION_JSON)
	public Object login(@FormParam("username")String userName, @FormParam("password")String password) {
		
		if(userName.equals("admin") && password.equals("test")) {
			User user = new User(userName, password);
			return user;
		} else {
			return new com.mycloud.error.Error(1, "Invalid user name or password");
		}
		
	}
}

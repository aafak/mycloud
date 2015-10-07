package com.mycloud.rest;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import com.mycloud.user.User;

@Path("/login")
public class LoginService {

	@POST
	@Path("/authenticate")
	@Produces(MediaType.APPLICATION_JSON)
	public Object login(@QueryParam("username")String userName, @QueryParam("password")String password) {
		
		System.out.println("username: "+userName+", password: "+password);
		if(userName.equals("admin") && password.equals("test")) {
			System.out.println("Login success");
			User user = new User(userName, password);
			return user;
		} else {
			System.out.println("Login failed");

			return new com.mycloud.error.Error(1, "Invalid user name or password");
		}
		
	}
}

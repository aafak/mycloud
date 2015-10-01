package com.mycloud.rest;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import com.mycloud.user.User;

@Path("/users")
public class UserService {

	@GET
	@Path("/user")
	@Produces(MediaType.APPLICATION_JSON)
	public Object login(@QueryParam("userid")String userId) {
		System.out.println("userId:"+userId);
		User user = new User("admin", "test");
		return user;
		
	}
}

package com.mycloud.error;

public class Error {

	long errCode;
	String errMsg;
	
	public Error(long errCode, String errMsg) {
		super();
		this.errCode = errCode;
		this.errMsg = errMsg;
	}
	
	public long getErrCode() {
		return errCode;
	}
	public void setErrCode(long errCode) {
		this.errCode = errCode;
	}
	public String getErrMsg() {
		return errMsg;
	}
	public void setErrMsg(String errMsg) {
		this.errMsg = errMsg;
	}
	
}

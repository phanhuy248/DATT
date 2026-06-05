package com.example.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.vnpay")
public class VnpayProperties {
    private String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private String tmnCode = "";
    private String hashSecret = "";
    private String returnUrl = "";
    private String ipnUrl = "";
    private String version = "2.1.0";
    private String command = "pay";
    private String currCode = "VND";
    private String locale = "vn";
    private String orderType = "other";
    private int expireMinutes = 15;

    public String getPayUrl() { return payUrl; }
    public void setPayUrl(String payUrl) { this.payUrl = clean(payUrl); }

    public String getTmnCode() { return tmnCode; }
    public void setTmnCode(String tmnCode) { this.tmnCode = clean(tmnCode); }

    public String getHashSecret() { return hashSecret; }
    public void setHashSecret(String hashSecret) { this.hashSecret = clean(hashSecret); }

    public String getReturnUrl() { return returnUrl; }
    public void setReturnUrl(String returnUrl) { this.returnUrl = clean(returnUrl); }

    public String getIpnUrl() { return ipnUrl; }
    public void setIpnUrl(String ipnUrl) { this.ipnUrl = clean(ipnUrl); }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = clean(version); }

    public String getCommand() { return command; }
    public void setCommand(String command) { this.command = clean(command); }

    public String getCurrCode() { return currCode; }
    public void setCurrCode(String currCode) { this.currCode = clean(currCode); }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = clean(locale); }

    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = clean(orderType); }

    public int getExpireMinutes() { return expireMinutes; }
    public void setExpireMinutes(int expireMinutes) { this.expireMinutes = expireMinutes; }

    private String clean(String value) {
        if (value == null) {
            return "";
        }
        String cleaned = value.trim();
        if (cleaned.length() >= 2
                && ((cleaned.startsWith("\"") && cleaned.endsWith("\""))
                || (cleaned.startsWith("'") && cleaned.endsWith("'")))) {
            return cleaned.substring(1, cleaned.length() - 1).trim();
        }
        return cleaned;
    }
}

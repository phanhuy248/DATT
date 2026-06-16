package com.smartshop.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.bank-transfer")
public class BankTransferProperties {
    private String qrImageBaseUrl = "https://img.vietqr.io/image";
    private String bankId = "";
    private String bankName = "";
    private String accountNumber = "";
    private String accountName = "";
    private String branch = "";
    private String template = "compact2";

    public String getQrImageBaseUrl() { return qrImageBaseUrl; }
    public void setQrImageBaseUrl(String qrImageBaseUrl) { this.qrImageBaseUrl = clean(qrImageBaseUrl); }

    public String getBankId() { return bankId; }
    public void setBankId(String bankId) { this.bankId = clean(bankId); }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = clean(bankName); }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = clean(accountNumber); }

    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = clean(accountName); }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = clean(branch); }

    public String getTemplate() { return template; }
    public void setTemplate(String template) { this.template = clean(template); }

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

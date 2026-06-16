package com.smartshop.demo.service;

import com.smartshop.demo.domain.Order;
import com.smartshop.demo.dto.order.OrderDTO;
import com.smartshop.demo.event.OrderConfirmationEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
public class MailService {
    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String from;

    public MailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    public void sendPasswordResetOtp(String email, String otp, long expirationMinutes) {
        String body = "Mã OTP đặt lại mật khẩu SmartShop của bạn là: " + otp
                + "\nMã có hiệu lực trong " + expirationMinutes + " phút."
                + "\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.";
        if (!send(email, "SmartShop - Mã OTP đặt lại mật khẩu", body)) {
            throw new IllegalStateException("Không thể gửi email OTP. Vui lòng kiểm tra cấu hình SMTP");
        }
    }

    public void sendPasswordReset(String email, String resetLink) {
        send(email, "SmartShop - Đặt lại mật khẩu",
                "Bạn có thể đặt lại mật khẩu tại liên kết sau: " + resetLink);
    }

    public void sendRegistrationOtp(String email, String otp, long expirationMinutes) {
        String body = "Ma OTP dang ky SmartShop cua ban la: " + otp
                + "\nMa co hieu luc trong " + expirationMinutes + " phut."
                + "\nNeu ban khong yeu cau tao tai khoan, vui long bo qua email nay.";
        if (!send(email, "SmartShop - Ma OTP dang ky tai khoan", body)) {
            throw new IllegalStateException("Khong the gui email OTP. Vui long kiem tra cau hinh SMTP");
        }
    }

    public void sendOrderConfirmation(Order order) {
        OrderDTO dto = OrderDTO.from(order);
        String body = "SmartShop đã ghi nhận đơn hàng #" + dto.getId()
                + "\nTổng tiền: " + dto.getTotalPrice() + " VNĐ"
                + "\nTrạng thái: " + dto.getStatus();
        send(order.getUser().getEmail(), "SmartShop - Xác nhận đơn hàng #" + dto.getId(), body);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async("mailTaskExecutor")
    public void onOrderConfirmation(OrderConfirmationEvent event) {
        String body = "SmartShop đã ghi nhận đơn hàng #" + event.getOrderId()
                + "\nTổng tiền: " + event.getTotalPrice() + " VNĐ"
                + "\nTrạng thái: " + event.getStatus();
        send(event.getUserEmail(), "SmartShop - Xác nhận đơn hàng #" + event.getOrderId(), body);
    }

    private boolean send(String to, String subject, String body) {
        if (!mailEnabled || mailSender == null || from == null || from.isBlank()) {
            log.info("[Mail disabled] To: {}, Subject: {}, Body: {}", to, subject, body);
            return true;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
            return true;
        } catch (MessagingException | RuntimeException e) {
            log.warn("Could not send mail to {}: {}", to, e.getMessage());
            return false;
        }
    }
}

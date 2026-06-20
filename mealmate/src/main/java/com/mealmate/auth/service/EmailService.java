package com.mealmate.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.mealmate.auth.exception.EmailDeliveryException;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    /**
     * Send verification email with HTML content containing the activation link.
     */
    public void sendVerificationEmail(String toEmail, String token) {
        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Skip sending verification email to: {}", toEmail);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Fiza - Xác thực tài khoản");

            String verificationLink = baseUrl + "/api/auth/verify?token=" + token;

            String htmlContent = """
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2e7d32;">🍽️ Chào mừng đến với Fiza!</h2>
                        <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào nút bên dưới để xác thực email:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s"
                               style="background-color: #4caf50; color: white; padding: 12px 30px;
                                      text-decoration: none; border-radius: 5px; font-size: 16px;">
                                Xác thực tài khoản
                            </a>
                        </div>
                        <p style="color: #666;">Link xác thực sẽ hết hạn sau 24 giờ.</p>
                        <hr style="border: none; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px;">Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
                    </div>
                    """.formatted(verificationLink);

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Verification email sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send verification email to: {}", toEmail, e);
            throw new RuntimeException("Không thể gửi email xác thực. Vui lòng thử lại sau.");
        }
    }
    public void sendTemporaryPasswordEmail(String toEmail, String tempPassword) {
        if (mailSender == null) {
            log.error("JavaMailSender chưa được cấu hình. Không thể gửi email tới: {}", toEmail);
            throw new EmailDeliveryException(
                    "Dịch vụ gửi email chưa được cấu hình. Mật khẩu hiện tại chưa bị thay đổi.");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Fiza - Cấp mật khẩu tạm thời khôi phục tài khoản");

            String htmlContent = """
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #00bcd4; text-align: center;">🔐 Mật khẩu tạm thời Fiza</h2>
                        <p>Chào bạn,</p>
                        <p>Hệ thống nhận được yêu cầu khôi phục mật khẩu từ bạn. Chúng tôi đã đặt lại và cấp cho bạn một mật khẩu đăng nhập tạm thời dưới đây:</p>
                        
                        <div style="text-align: center; margin: 30px 0; background-color: #f5f5f5; padding: 15px; border-radius: 5px; border: 1px dashed #00bcd4;">
                            <span style="font-size: 24px; font-weight: bold; color: #e67e22; letter-spacing: 2px;">%s</span>
                        </div>
                        
                        <p style="color: #ff5722; font-weight: 500;">⚠️ Lưu ý bảo mật:</p>
                        <ul>
                            <li>Hãy sử dụng mật khẩu này để đăng nhập ngay vào hệ thống Fiza.</li>
                            <li>Sau khi đăng nhập thành công, vui lòng truy cập vào phần <strong>Cài đặt tài khoản (Profile)</strong> để đổi lại mật khẩu cá nhân của bạn.</li>
                        </ul>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                    </div>
                    """.formatted(tempPassword);

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("📧 [FIZA SUCCESS] Đã gửi thành công mật khẩu tạm về Gmail: {}", toEmail);
        } catch (MessagingException | MailException e) {
            log.error("Không thể gửi email mật khẩu tạm tới: {}", toEmail, e);
            throw new EmailDeliveryException(
                    "Không thể gửi email khôi phục mật khẩu. Mật khẩu hiện tại chưa bị thay đổi.",
                    e);
        }
    }
}

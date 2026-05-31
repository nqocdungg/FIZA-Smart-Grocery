package com.mealmate.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

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
            helper.setSubject("MealMate - Xác thực tài khoản");

            String verificationLink = baseUrl + "/api/auth/verify?token=" + token;

            String htmlContent = """
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2e7d32;">🍽️ Chào mừng đến với MealMate!</h2>
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
}

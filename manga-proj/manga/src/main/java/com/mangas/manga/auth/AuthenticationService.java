package com.mangas.manga.auth;

import com.mangas.manga.email.EmailService;
import com.mangas.manga.role.Role;
import com.mangas.manga.role.RoleRepository;
import com.mangas.manga.security.JwtService;
import com.mangas.manga.user.Token;
import com.mangas.manga.user.TokenRepository;
import com.mangas.manga.user.User;
import com.mangas.manga.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    @Autowired // Add Autowired annotation
    private RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final TokenRepository   tokenRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Autowired
    private EmailService emailSenderService;
    public void register(RegistrationRequest request) {
        // Ensure the "USER" role exists or create it
        Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    Role role = Role.builder().name("USER").build();
                    return roleRepository.save(role);
                });

        // Encode the password before saving
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(encodedPassword)
                .accountLocked(false)
                .enabled(false)
                .roles(List.of(userRole))
                .build();

        userRepository.save(user);
        sendValidationEmail(user);
    }

    private void sendValidationEmail(User user) {
        String newToken = generateAndSaveActivationToken(user);

        String confirmationLink = "http://localhost:4200/confirm?token=" + newToken;
        String imageUrl = "https://d226aj4ao1t61q.cloudfront.net/ai2shais_blog_confirmationmail.png";

        String htmlContent = "<html><body>" +
                "<div style='text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 5px;background-color:bisque;'>" +
                "<h1 >Hello  " + user.getFirstName() + " " + user.getLastName() + "!</h1>" +
                "<p>Click the button below to verify your account:</p>" +
                "<a href='" + confirmationLink + "' style='display: inline-block; padding: 10px 20px; background-color: #4caf50; color: #ffffff; text-decoration: none; border-radius: 5px;'>Confirm Email</a>" +
                "<br><br>" +
                "<img src='" + imageUrl + "' alt='Cart Image' style='max-width: 100%; max-height:60%; border-radius:5px;'><br>" +
                "</div></body></html>";

        // Send the email with HTML content
        emailSenderService.sendHtmlEmail(user.getEmail(), "Activate Your Account", htmlContent);

    }

    public void activateUser(String token) {
        Token activationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid activation token"));

        if (activationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Activation token has expired");
        }

        User user = activationToken.getUser();
        user.setEnabled(true);
        userRepository.save(user);
        activationToken.setValidatedAt(LocalDateTime.now());
        tokenRepository.save(activationToken);

        // Optional: You can delete the activation token after it's used

    }

    private String generateAndSaveActivationToken(User user) {
        String generatedToken=generateActivationCode(6);
        var toke= Token.builder()
                .token(generatedToken)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .user(user)
                .build();
        tokenRepository.save(toke);
        return generatedToken;
    }

    private String generateActivationCode(int length) {
        String characters = "0123456789";
        StringBuilder sb = new StringBuilder();
        SecureRandom Secure = new SecureRandom();
        for (int i = 0; i < length; i++) {
            int index = Secure.nextInt(characters.length());
            sb.append(characters.charAt(index));
        }
        return sb.toString();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        var auth=authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var claims=new HashMap<String,Object>();
        var user=((User)auth.getPrincipal());
        claims.put("fullName",user.getName());
        var jwt= jwtService.generateToken(claims,user);
        return AuthenticationResponse.builder()
                .token(jwt)
                .build();


    }
}

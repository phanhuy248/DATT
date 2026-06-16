package com.smartshop.demo.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.smartshop.demo.domain.Banner;
import com.smartshop.demo.domain.ContactMessage;
import com.smartshop.demo.domain.Coupon;
import com.smartshop.demo.domain.DiscountType;
import com.smartshop.demo.domain.Post;
import com.smartshop.demo.domain.Role;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.repository.BannerRepository;
import com.smartshop.demo.repository.ContactMessageRepository;
import com.smartshop.demo.repository.CouponRepository;
import com.smartshop.demo.repository.PostRepository;
import com.smartshop.demo.repository.RoleRepository;
import com.smartshop.demo.repository.UserRepository;
import com.smartshop.demo.service.DataSeedService;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BannerRepository bannerRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final PostRepository postRepository;
    private final CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;
    private final DataSeedService dataSeedService;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.demo-users.enabled:true}")
    private boolean demoUsersEnabled;

    @Value("${app.demo-content.enabled:true}")
    private boolean demoContentEnabled;

    public DataInitializer(UserRepository userRepository,
                           RoleRepository roleRepository,
                           BannerRepository bannerRepository,
                           ContactMessageRepository contactMessageRepository,
                           PostRepository postRepository,
                           CouponRepository couponRepository,
                           PasswordEncoder passwordEncoder,
                           DataSeedService dataSeedService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.bannerRepository = bannerRepository;
        this.contactMessageRepository = contactMessageRepository;
        this.postRepository = postRepository;
        this.couponRepository = couponRepository;
        this.passwordEncoder = passwordEncoder;
        this.dataSeedService = dataSeedService;
    }

    @Override
    public void run(ApplicationArguments args) {
        initRoles();
        initUsers();
        if (seedEnabled) {
            dataSeedService.seedProducts();
        } else {
            log.info("[Seed] Product seeding is disabled (app.seed.enabled=false).");
        }
        initDemoContent();
    }

    private void initRoles() {
        if (this.roleRepository.findByName("ADMIN") == null) {
            Role adminRole = new Role();
            adminRole.setName("ADMIN");
            adminRole.setDescription("Administrator");
            this.roleRepository.save(adminRole);
        }
        if (this.roleRepository.findByName("USER") == null) {
            Role userRole = new Role();
            userRole.setName("USER");
            userRole.setDescription("User");
            this.roleRepository.save(userRole);
        }
        if (this.roleRepository.findByName("STAFF") == null) {
            Role staffRole = new Role();
            staffRole.setName("STAFF");
            staffRole.setDescription("Staff");
            this.roleRepository.save(staffRole);
        }
    }

    private void initUsers() {
        if (!demoUsersEnabled) {
            log.info("[Init] Demo users are disabled (app.demo-users.enabled=false).");
            return;
        }
        if (!this.userRepository.existsByEmail("admin@gmail.com")) {
            User admin = new User();
            admin.setEmail("admin@gmail.com");
            admin.setPassword(this.passwordEncoder.encode("123456"));
            admin.setFullName("Administrator");
            admin.setAddress("Hà Nội");
            admin.setPhone("0900000000");
            admin.setRole(this.roleRepository.findByName("ADMIN"));
            this.userRepository.save(admin);
            log.info("[Init] Created demo admin user admin@gmail.com");
        }

        if (!this.userRepository.existsByEmail("user@gmail.com")) {
            User user = new User();
            user.setEmail("user@gmail.com");
            user.setPassword(this.passwordEncoder.encode("123456"));
            user.setFullName("Người dùng");
            user.setAddress("Hồ Chí Minh");
            user.setPhone("0900000001");
            user.setRole(this.roleRepository.findByName("USER"));
            this.userRepository.save(user);
            log.info("[Init] Created demo customer user user@gmail.com");
        }
    }

    private void initDemoContent() {
        if (!demoContentEnabled) {
            log.info("[Init] Demo content is disabled (app.demo-content.enabled=false).");
            return;
        }
        initDemoBanners();
        initDemoContacts();
        initDemoPosts();
        initDemoCoupons();
    }

    private void initDemoBanners() {
        if (!bannerRepository.findByDeletedFalseOrderBySortOrderAscIdDesc().isEmpty()) {
            log.info("[Init] Banners already exist - skipping demo banner seed.");
            return;
        }

        createBannerIfMissing(
                "Laptop gaming sale cuối tuần",
                "Giảm đến 20% cho laptop gaming, tặng kèm balo và chuột không dây.",
                "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80",
                "/products?keyword=Laptop",
                1
        );
        createBannerIfMissing(
                "Smartphone mới lên kệ",
                "Nhiều mẫu điện thoại mới, trả góp linh hoạt và giao nhanh trong ngày.",
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
                "/products?keyword=Dien%20thoai",
                2
        );
        createBannerIfMissing(
                "Phụ kiện làm việc thông minh",
                "Bàn phím, chuột, tai nghe và hub USB-C cho góc làm việc gọn gàng hơn.",
                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=80",
                "/products?keyword=Phu%20kien",
                3
        );
    }

    private void createBannerIfMissing(String title, String subtitle, String image, String linkUrl, int sortOrder) {
        boolean exists = bannerRepository.findByDeletedFalseOrderBySortOrderAscIdDesc()
                .stream()
                .anyMatch(item -> title.equalsIgnoreCase(item.getTitle()));
        if (exists) return;

        Banner banner = new Banner();
        banner.setTitle(title);
        banner.setSubtitle(subtitle);
        banner.setImage(image);
        banner.setLinkUrl(linkUrl);
        banner.setSortOrder(sortOrder);
        banner.setActive(true);
        bannerRepository.save(banner);
    }

    private void initDemoContacts() {
        createContactIfMissing(
                "Nguyễn Minh Anh",
                "minhanh.demo@gmail.com",
                "0912345678",
                "Tư vấn mua laptop cho sinh viên",
                "Mình cần laptop học lập trình, ngân sách khoảng 18 triệu. Shop tư vấn giúp mẫu nào pin tốt và nhẹ."
        );
        createContactIfMissing(
                "Trần Quốc Bảo",
                "quocbao.demo@gmail.com",
                "0987654321",
                "Hỏi về bảo hành sản phẩm",
                "Đơn hàng vừa nhận có sạc bị nóng. Mình muốn biết quy trình kiểm tra và đổi bảo hành như thế nào."
        );
    }

    private void createContactIfMissing(String fullName, String email, String phone, String subject, String message) {
        if (contactMessageRepository.existsByEmailAndSubject(email, subject)) return;

        ContactMessage contact = new ContactMessage();
        contact.setFullName(fullName);
        contact.setEmail(email);
        contact.setPhone(phone);
        contact.setSubject(subject);
        contact.setMessage(message);
        contact.setHandled(false);
        contactMessageRepository.save(contact);
    }

    private void initDemoPosts() {
        createPostIfMissing(
                "5 tiêu chí chọn laptop học tập năm 2026",
                "5-tieu-chi-chon-laptop-hoc-tap-2026",
                "Gợi ý cách chọn cấu hình, pin, màn hình và trọng lượng laptop phù hợp cho học sinh sinh viên.",
                "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
                """
                Khi chọn laptop học tập, bạn nên ưu tiên CPU tiết kiệm điện, RAM tối thiểu 16GB và SSD từ 512GB để máy dùng bền trong nhiều năm.

                Nếu thường xuyên mang theo, trọng lượng dưới 1.5kg và thời lượng pin 8 giờ trở lên sẽ tạo khác biệt rõ trong trải nghiệm hàng ngày.

                Với ngành đồ họa hoặc kỹ thuật, hãy cân nhắc màn hình màu tốt và GPU rời nếu phần mềm học tập yêu cầu.
                """
        );
        createPostIfMissing(
                "Hướng dẫn dùng mã giảm giá trên SMARTSHOP",
                "huong-dan-dung-ma-giam-gia-smartshop",
                "Cách nhập coupon ở bước thanh toán và các điều kiện thường gặp khi sử dụng ưu đãi.",
                "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1200&q=80",
                """
                Tại bước thanh toán, nhập mã khuyến mại vào ô mã giảm giá và bấm áp dụng. Hệ thống sẽ tính lại tổng tiền nếu mã còn hiệu lực.

                Một số mã có điều kiện đơn tối thiểu, giới hạn lượt dùng hoặc chỉ áp dụng trong khoảng thời gian nhất định.

                Nếu mã không hợp lệ, bạn có thể kiểm tra lại ký tự, ngày hết hạn và giá trị đơn hàng hiện tại.
                """
        );
        createPostIfMissing(
                "Cách bảo quản pin điện thoại và laptop",
                "cach-bao-quan-pin-dien-thoai-va-laptop",
                "Những thói quen sạc và sử dụng giúp pin ổn định hơn trong quá trình làm việc mỗi ngày.",
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
                """
                Nên tránh để thiết bị quá nóng khi sạc, đặc biệt khi vừa sạc vừa chạy tác vụ nặng.

                Với laptop, hãy bật chế độ bảo vệ pin nếu thường xuyên cắm sạc tại bàn làm việc.

                Sử dụng sạc chính hãng hoặc sạc đạt chuẩn giúp giảm rủi ro chai pin và lỗi nguồn.
                """
        );
    }

    private void createPostIfMissing(String title, String slug, String summary, String thumbnail, String content) {
        if (postRepository.existsBySlugAndDeletedFalse(slug)) return;

        Post post = new Post();
        post.setTitle(title);
        post.setSlug(slug);
        post.setSummary(summary);
        post.setThumbnail(thumbnail);
        post.setContent(content.strip());
        post.setPublished(true);
        postRepository.save(post);
    }

    private void initDemoCoupons() {
        createCouponIfMissing(
                "SMART50",
                "Giảm 50.000đ cho đơn từ 1.000.000đ.",
                DiscountType.FIXED,
                new BigDecimal("50000"),
                new BigDecimal("1000000"),
                200
        );
        createCouponIfMissing(
                "LAPTOP10",
                "Giảm 10% cho đơn laptop từ 15.000.000đ.",
                DiscountType.PERCENT,
                new BigDecimal("10"),
                new BigDecimal("15000000"),
                80
        );
        createCouponIfMissing(
                "FREESHIP",
                "Hỗ trợ 30.000đ phí giao hàng cho đơn từ 500.000đ.",
                DiscountType.FIXED,
                new BigDecimal("30000"),
                new BigDecimal("500000"),
                500
        );
    }

    private void createCouponIfMissing(String code, String description, DiscountType discountType,
                                       BigDecimal discountValue, BigDecimal minOrderAmount, int usageLimit) {
        if (couponRepository.existsByCodeIgnoreCaseAndDeletedFalse(code)) return;

        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setDescription(description);
        coupon.setDiscountType(discountType);
        coupon.setDiscountValue(discountValue);
        coupon.setMinOrderAmount(minOrderAmount);
        coupon.setStartDate(LocalDateTime.now().minusDays(7));
        coupon.setEndDate(LocalDateTime.now().plusDays(30));
        coupon.setUsageLimit(usageLimit);
        coupon.setUsedCount(0);
        coupon.setActive(true);
        couponRepository.save(coupon);
    }
}

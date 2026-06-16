-- ============================================================
-- V1__initial_schema.sql  —  SmartShop initial database schema
-- Chạy lần đầu trên DB trống. Trên DB cũ (ddl-auto=update),
-- Flyway tự bỏ qua nhờ baseline-on-migrate=true trong application.properties.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Roles ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id   BIGINT       NOT NULL AUTO_INCREMENT,
    name VARCHAR(50)  NOT NULL UNIQUE,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    email      VARCHAR(255) NOT NULL,
    password   VARCHAR(255),
    full_name  VARCHAR(255),
    address    VARCHAR(500),
    phone      VARCHAR(20),
    avatar     VARCHAR(500),
    active     TINYINT(1)   NOT NULL DEFAULT 1,
    role_id    BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY idx_user_email (email),
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id      BIGINT       NOT NULL AUTO_INCREMENT,
    name    VARCHAR(255),
    image   VARCHAR(500),
    deleted TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Suppliers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
    id      BIGINT       NOT NULL AUTO_INCREMENT,
    name    VARCHAR(255),
    address VARCHAR(500),
    phone   VARCHAR(20),
    email   VARCHAR(255),
    deleted TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    version          BIGINT,
    name             VARCHAR(255)    NOT NULL,
    price            DECIMAL(15,2)   NOT NULL,
    image            VARCHAR(500),
    detail_desc      MEDIUMTEXT,
    short_desc       VARCHAR(500),
    quantity         BIGINT          NOT NULL DEFAULT 0,
    sold             BIGINT          NOT NULL DEFAULT 0,
    factory          VARCHAR(255),
    target           VARCHAR(255),
    deleted          TINYINT(1)      NOT NULL DEFAULT 0,
    source_site      VARCHAR(128),
    source_url       VARCHAR(1024),
    external_id      VARCHAR(128),
    specifications   MEDIUMTEXT,
    gallery_images   MEDIUMTEXT,
    last_synced_at   DATETIME(6),
    category_id      BIGINT,
    supplier_id      BIGINT,
    created_at       DATETIME(6),
    updated_at       DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_product_name     (name),
    INDEX idx_product_factory  (factory),
    INDEX idx_product_category (category_id),
    INDEX idx_product_price    (price),
    INDEX idx_product_sold     (sold),
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id               BIGINT        NOT NULL AUTO_INCREMENT,
    total_price      DECIMAL(15,2),
    discount_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
    receiver_name    VARCHAR(255),
    receiver_address VARCHAR(500),
    receiver_phone   VARCHAR(20),
    status           VARCHAR(50),
    payment_method   VARCHAR(50),
    payment_status   VARCHAR(50),
    transaction_code VARCHAR(255),
    coupon_code      VARCHAR(100),
    created_date     DATETIME(6),
    updated_at       DATETIME(6),
    user_id          BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Order Details ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_details (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    quantity   BIGINT        NOT NULL,
    price      DECIMAL(15,2) NOT NULL,
    order_id   BIGINT        NOT NULL,
    product_id BIGINT        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_detail_order   FOREIGN KEY (order_id)   REFERENCES orders   (id),
    CONSTRAINT fk_detail_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Order Status History ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_status_history (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    old_status     VARCHAR(50),
    new_status     VARCHAR(50),
    note           TEXT,
    created_at     DATETIME(6),
    order_id       BIGINT      NOT NULL,
    changed_by_id  BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_history_order      FOREIGN KEY (order_id)      REFERENCES orders (id),
    CONSTRAINT fk_history_changed_by FOREIGN KEY (changed_by_id) REFERENCES users  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Cart Items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    quantity   BIGINT NOT NULL DEFAULT 1,
    user_id    BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cart_user_product (user_id, product_id),
    CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users    (id),
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Reviews ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id         BIGINT  NOT NULL AUTO_INCREMENT,
    rating     INT     NOT NULL,
    comment    TEXT,
    created_at DATETIME(6),
    user_id    BIGINT  NOT NULL,
    product_id BIGINT  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_review_user    FOREIGN KEY (user_id)    REFERENCES users    (id),
    CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Posts (Tin tức) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    title      VARCHAR(500),
    content    MEDIUMTEXT,
    image      VARCHAR(500),
    summary    VARCHAR(1000),
    category   VARCHAR(255),
    deleted    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    author_id  BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Banners ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    title      VARCHAR(255),
    image      VARCHAR(500),
    link       VARCHAR(500),
    active     TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Coupons ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    code             VARCHAR(100)   NOT NULL,
    description      VARCHAR(500),
    discount_type    VARCHAR(50)    NOT NULL,
    discount_value   DECIMAL(15,2)  NOT NULL,
    min_order_amount DECIMAL(15,2),
    start_date       DATETIME(6),
    end_date         DATETIME(6),
    usage_limit      INT            NOT NULL DEFAULT 0,
    used_count       INT            NOT NULL DEFAULT 0,
    active           TINYINT(1)     NOT NULL DEFAULT 1,
    deleted          TINYINT(1)     NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_coupon_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Stock Imports ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_imports (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    quantity     BIGINT        NOT NULL,
    note         TEXT,
    import_price DECIMAL(15,2),
    created_at   DATETIME(6),
    product_id   BIGINT        NOT NULL,
    supplier_id  BIGINT,
    imported_by  BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_stock_product  FOREIGN KEY (product_id)  REFERENCES products  (id),
    CONSTRAINT fk_stock_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
    CONSTRAINT fk_stock_user     FOREIGN KEY (imported_by) REFERENCES users     (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Product Price History ────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_price_history (
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    old_price     DECIMAL(15,2),
    new_price     DECIMAL(15,2),
    changed_at    DATETIME(6),
    product_id    BIGINT        NOT NULL,
    changed_by_id BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_price_hist_product    FOREIGN KEY (product_id)    REFERENCES products (id),
    CONSTRAINT fk_price_hist_changed_by FOREIGN KEY (changed_by_id) REFERENCES users    (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Password Reset Tokens (flow cũ — giữ để backward compat) ─
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    token      VARCHAR(255) NOT NULL UNIQUE,
    email      VARCHAR(255) NOT NULL,
    expires_at DATETIME(6)  NOT NULL,
    consumed   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_prt_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Password Reset OTPs (flow mới) ───────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    email      VARCHAR(255) NOT NULL,
    otp_hash   VARCHAR(255) NOT NULL,
    expires_at DATETIME(6)  NOT NULL,
    created_at DATETIME(6),
    attempts   INT          NOT NULL DEFAULT 0,
    consumed   TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_pro_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Registration OTPs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registration_otps (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    email      VARCHAR(255) NOT NULL,
    otp_hash   VARCHAR(255) NOT NULL,
    expires_at DATETIME(6)  NOT NULL,
    created_at DATETIME(6),
    attempts   INT          NOT NULL DEFAULT 0,
    consumed   TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_reg_otp_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Refresh Tokens ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    token      VARCHAR(512) NOT NULL UNIQUE,
    expires_at DATETIME(6)  NOT NULL,
    revoked    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME(6),
    user_id    BIGINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Google OAuth2 Profile Completion ─────────────────────────
CREATE TABLE IF NOT EXISTS google_oauth2_profile_completions (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    token       VARCHAR(512) NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL,
    google_id   VARCHAR(255),
    given_name  VARCHAR(255),
    family_name VARCHAR(255),
    picture     VARCHAR(500),
    expires_at  DATETIME(6)  NOT NULL,
    consumed    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── View History ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS view_history (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    viewed_at  DATETIME(6),
    user_id    BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_view_user    (user_id),
    INDEX idx_view_product (product_id),
    CONSTRAINT fk_view_user    FOREIGN KEY (user_id)    REFERENCES users    (id),
    CONSTRAINT fk_view_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Inventory Transactions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id               BIGINT      NOT NULL AUTO_INCREMENT,
    type             VARCHAR(50) NOT NULL,
    quantity         BIGINT      NOT NULL,
    before_quantity  BIGINT      NOT NULL,
    after_quantity   BIGINT      NOT NULL,
    reference_type   VARCHAR(50),
    reference_id     BIGINT,
    note             VARCHAR(500),
    created_at       DATETIME(6),
    product_id       BIGINT      NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_inv_product (product_id),
    CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Contact Messages ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    name          VARCHAR(255),
    email         VARCHAR(255),
    phone         VARCHAR(20),
    subject       VARCHAR(500),
    message       TEXT,
    created_at    DATETIME(6),
    replied       TINYINT(1)   NOT NULL DEFAULT 0,
    reply_message TEXT,
    replied_at    DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Audit Logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    action      VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id   BIGINT,
    old_value   TEXT,
    new_value   TEXT,
    ip_address  VARCHAR(50),
    created_at  DATETIME(6),
    user_id     BIGINT,
    PRIMARY KEY (id),
    INDEX idx_audit_user   (user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================================================
-- TẬP ĐOÀN THACO AGRI - CƠ SỞ DỮ LIỆU MICROSOFT SQL SERVER
-- DỰ ÁN: HỆ THỐNG QUẢN TRỊ VÀ BÁO CÁO CHI PHÍ DOANH NGHIỆP
-- Phiên bản: 1.0 (Tương thích SQL Server 2016, 2019, 2022 và Azure SQL Database)
-- Đặc tả theo tài liệu phân tích nghiệp vụ THACO AGRI (15 trang)
-- ==========================================================================================

-- 0. TẠO CƠ SỞ DỮ LIỆU
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'THACO_AGRI_CostManagement')
BEGIN
    CREATE DATABASE THACO_AGRI_CostManagement;
END
GO

USE THACO_AGRI_CostManagement;
GO

-- XÓA BẢNG NẾU ĐÃ TỒN TẠI ĐỂ TÁI TẠO MỚI (DROP TABLES IF EXISTS THEO THỨ TỰ RÀNG BUỘC)
IF OBJECT_ID(N'dbo.Expenses', N'U') IS NOT NULL DROP TABLE dbo.Expenses;
IF OBJECT_ID(N'dbo.CostCatalog', N'U') IS NOT NULL DROP TABLE dbo.CostCatalog;
IF OBJECT_ID(N'dbo.CostGroups', N'U') IS NOT NULL DROP TABLE dbo.CostGroups;
IF OBJECT_ID(N'dbo.Suppliers', N'U') IS NOT NULL DROP TABLE dbo.Suppliers;
IF OBJECT_ID(N'dbo.CostObjects', N'U') IS NOT NULL DROP TABLE dbo.CostObjects;
IF OBJECT_ID(N'dbo.CostUnits', N'U') IS NOT NULL DROP TABLE dbo.CostUnits;
IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID(N'dbo.Roles', N'U') IS NOT NULL DROP TABLE dbo.Roles;
GO

-- ==========================================================================================
-- 1. BẢNG PHÂN QUYỀN HỆ THỐNG (Roles)
-- Quản lý các vai trò trong hệ thống: ADMIN (Quản trị) và USER (Bình thường / Nhân viên)
-- ==========================================================================================
CREATE TABLE dbo.Roles (
    RoleID VARCHAR(20) NOT NULL PRIMARY KEY,
    RoleName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- ==========================================================================================
-- 2. BẢNG NGƯỜI DÙNG / NHÂN VIÊN (Users)
-- Quản lý tài khoản, mã nhân viên và quyền hạn truy cập nghiệp vụ
-- ==========================================================================================
CREATE TABLE dbo.Users (
    MaNV VARCHAR(20) NOT NULL PRIMARY KEY,
    TenNV NVARCHAR(150) NOT NULL,
    HashPass VARCHAR(255) NOT NULL DEFAULT 'user123',
    RoleID VARCHAR(20) NOT NULL,
    PhongBan NVARCHAR(150) NOT NULL,
    Email VARCHAR(150) NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleID) REFERENCES dbo.Roles(RoleID)
);
GO

-- ==========================================================================================
-- 3. BẢNG ĐƠN VỊ CHỊU CHI PHÍ (CostUnits)
-- Các pháp nhân trực thuộc: THACO AGRI (DV01), HNG (DV02), THAGRICO (DV03),...
-- ==========================================================================================
CREATE TABLE dbo.CostUnits (
    MaDonVi VARCHAR(20) NOT NULL PRIMARY KEY,
    TenDonVi NVARCHAR(100) NOT NULL,
    TenDayDu NVARCHAR(255) NOT NULL,
    DiaChi NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

-- ==========================================================================================
-- 4. BẢNG ĐỐI TƯỢNG CHI PHÍ (CostObjects)
-- Phân bổ chi phí theo phòng ban điều hành, dự án đầu tư thiết bị, nhà xưởng nông trường
-- ==========================================================================================
CREATE TABLE dbo.CostObjects (
    MaDoiTuong VARCHAR(20) NOT NULL PRIMARY KEY,
    TenDoiTuong NVARCHAR(255) NOT NULL,
    MoTa NVARCHAR(500) NULL,
    MaDonVi VARCHAR(20) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_CostObjects_CostUnits FOREIGN KEY (MaDonVi) REFERENCES dbo.CostUnits(MaDonVi)
);
GO

-- ==========================================================================================
-- 5. BẢNG NHÓM DANH MỤC CHI PHÍ (CostGroups)
-- Cấu trúc phân cấp cha - con: Nhóm 3002 (CCDC), C01, C02 (Giao tế), C04,...
-- ==========================================================================================
CREATE TABLE dbo.CostGroups (
    MaNhom VARCHAR(20) NOT NULL PRIMARY KEY,
    TenNhom NVARCHAR(255) NOT NULL,
    MoTa NVARCHAR(500) NULL,
    NhomCha VARCHAR(20) NULL,
    ThuTuHienThi INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

-- ==========================================================================================
-- 6. BẢNG DANH MỤC HÀNG HÓA / DỊCH VỤ CHI PHÍ (CostCatalog)
-- Danh mục chi tiết hơn 60 mặt hàng chuẩn hóa từ tài liệu trang 4-14
-- ==========================================================================================
CREATE TABLE dbo.CostCatalog (
    MaChiPhi VARCHAR(50) NOT NULL PRIMARY KEY,
    MaNhom VARCHAR(20) NOT NULL,
    TenDanhMuc NVARCHAR(255) NOT NULL,
    PhanLoai VARCHAR(20) NOT NULL,
    DVT NVARCHAR(50) NOT NULL DEFAULT N'Cái',
    GhiChu NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_CostCatalog_CostGroups FOREIGN KEY (MaNhom) REFERENCES dbo.CostGroups(MaNhom),
    CONSTRAINT CK_CostCatalog_PhanLoai CHECK (PhanLoai IN ('CC-DC', 'CC-DC/TS', 'VATTU', 'TS', 'DICHVU', 'GIAOTE'))
);
GO

-- ==========================================================================================
-- 7. BẢNG NHÀ CUNG CẤP (Suppliers)
-- Danh sách các đối tác cung cấp dịch vụ và hàng hóa cho THACO AGRI (Trang 3 tài liệu)
-- ==========================================================================================
CREATE TABLE dbo.Suppliers (
    MaNCC VARCHAR(20) NOT NULL PRIMARY KEY,
    TenNCC NVARCHAR(255) NOT NULL,
    MST VARCHAR(20) NULL,
    TenDanhMucHangHoa NVARCHAR(500) NULL,
    SoDienThoai VARCHAR(50) NULL,
    DiaChi NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

-- ==========================================================================================
-- 8. BẢNG NGHIỆP VỤ PHÁT SINH CHI PHÍ (Expenses)
-- Lưu trữ chi tiết các khoản chi phí phát sinh, hóa đơn, chứng từ kế toán
-- ==========================================================================================
CREATE TABLE dbo.Expenses (
    ID BIGINT IDENTITY(1,1) PRIMARY KEY,
    MaGiaoDich VARCHAR(30) NOT NULL UNIQUE,
    NgayPhatSinh DATE NOT NULL,
    SoChungTu NVARCHAR(50) NULL,
    MaDanhMucChiPhi VARCHAR(50) NOT NULL,
    PhanLoai VARCHAR(20) NOT NULL,
    DienGiai NVARCHAR(500) NOT NULL,
    MaDonVi VARCHAR(20) NOT NULL,
    MaDoiTuong VARCHAR(20) NOT NULL,
    MaNCC VARCHAR(20) NOT NULL,
    SoTien DECIMAL(18,2) NOT NULL DEFAULT 0,
    NguoiPhuTrach VARCHAR(20) NOT NULL,
    TrangThai NVARCHAR(30) NOT NULL DEFAULT N'DA_DUYET',
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Expenses_CostCatalog FOREIGN KEY (MaDanhMucChiPhi) REFERENCES dbo.CostCatalog(MaChiPhi),
    CONSTRAINT FK_Expenses_CostUnits FOREIGN KEY (MaDonVi) REFERENCES dbo.CostUnits(MaDonVi),
    CONSTRAINT FK_Expenses_CostObjects FOREIGN KEY (MaDoiTuong) REFERENCES dbo.CostObjects(MaDoiTuong),
    CONSTRAINT FK_Expenses_Suppliers FOREIGN KEY (MaNCC) REFERENCES dbo.Suppliers(MaNCC),
    CONSTRAINT FK_Expenses_Users FOREIGN KEY (NguoiPhuTrach) REFERENCES dbo.Users(MaNV)
);
GO

-- TẠO CHỈ MỤC INDEXES ĐỂ TĂNG TỐC ĐỘ TRUY VẤN VÀ TÍNH TOÁN BÁO CÁO
CREATE NONCLUSTERED INDEX IX_Expenses_NgayPhatSinh ON dbo.Expenses(NgayPhatSinh);
CREATE NONCLUSTERED INDEX IX_Expenses_MaDonVi ON dbo.Expenses(MaDonVi);
CREATE NONCLUSTERED INDEX IX_Expenses_NguoiPhuTrach ON dbo.Expenses(NguoiPhuTrach);
CREATE NONCLUSTERED INDEX IX_Expenses_MaDanhMucChiPhi ON dbo.Expenses(MaDanhMucChiPhi);
CREATE NONCLUSTERED INDEX IX_Expenses_MaNCC ON dbo.Expenses(MaNCC);
GO

-- ==========================================================================================
-- DỮ LIỆU BAN ĐẦU (SEED DATA CHUẨN THEO ĐẶC TẢ TÀI LIỆU)
-- ==========================================================================================

-- 1. Thêm 4 Roles theo quy định phân quyền của hệ thống
INSERT INTO dbo.Roles (RoleID, RoleName, Description) VALUES
('ADMIN', N'Role Admin (Toàn quyền)', N'Đủ tất cả các quyền hệ thống: Trang chủ, Dashboard, Báo cáo, Quản trị đầy đủ 7 phân hệ bao gồm phân quyền Role và Người dùng'),
('QUAN_TRI', N'Role Quản trị', N'Phân quyền xem Trang chủ, Dashboard phân tích, Trang báo cáo toàn hệ thống'),
('QUAN_LY_CHI_PHI', N'Role Quản lý chi phí', N'Truy cập tất cả các tính năng trừ phân hệ quản lý role và quản lý người dùng'),
('USER', N'Role Người dùng', N'Quyền truy cập Trang chủ và Trang báo cáo (chỉ xem và tổng hợp dữ liệu của chính user đó)');
GO

-- 2. Thêm Users mẫu đại diện cho 4 Role
INSERT INTO dbo.Users (MaNV, TenNV, HashPass, RoleID, PhongBan, Email) VALUES
('NV001', N'Nguyễn Văn An', 'admin123', 'ADMIN', N'Khối Hành chính - Quản trị', 'an.nguyen@thaco.com.vn'),
('NV004', N'Phạm Quốc Tuấn', 'quantri123', 'QUAN_TRI', N'Ban Giám đốc & Quản trị', 'tuan.pham@thaco.com.vn'),
('NV003', N'Lê Hoàng Nam', 'qlcp123', 'QUAN_LY_CHI_PHI', N'Ban Quản trị Chi phí & Mua sắm', 'nam.le@thaco.com.vn'),
('NV002', N'Trần Thị Bình', 'user123', 'USER', N'Khối Kinh doanh & Vận hành', 'binh.tran@thaco.com.vn');
GO

-- 3. Thêm CostUnits (Đơn vị chịu chi phí)
INSERT INTO dbo.CostUnits (MaDonVi, TenDonVi, TenDayDu, DiaChi) VALUES
('DV01', N'THACO AGRI', N'Công ty Cổ phần Nông nghiệp Trường Hải (THACO AGRI)', N'Khu Công Nghiệp Chu Lai, Quảng Nam'),
('DV02', N'HNG', N'Công ty Cổ phần Nông nghiệp Quốc tế Hoàng Anh Gia Lai (HNG)', N'Số 15 Trường Chinh, Pleiku, Gia Lai'),
('DV03', N'THAGRICO', N'Tổng công ty Nông nghiệp THAGRICO', N'Tòa nhà Sofic, Thủ Thiêm, TP. Thủ Đức'),
('DV04', N'VPĐH Pleiku', N'Văn phòng Điều hành Nông nghiệp Pleiku Gia Lai', N'TP. Pleiku, Gia Lai'),
('DV05', N'VP Sadora', N'Văn phòng Đại diện Khu Đô thị Sala - Sadora', N'Số 10 Mai Chí Thọ, TP. Thủ Đức');
GO

-- 4. Thêm CostObjects (Đối tượng chi phí)
INSERT INTO dbo.CostObjects (MaDoiTuong, TenDoiTuong, MoTa, MaDonVi) VALUES
('DT01', N'Khối Văn phòng Điều hành', N'Chi phí vận hành thường xuyên và nghiệp vụ ban lãnh đạo', 'DV01'),
('DT02', N'Dự án Đầu tư Thiết bị 2026', N'Mua sắm công cụ dụng cụ, máy vi tính và thiết bị văn phòng năm 2026', 'DV01'),
('DT03', N'Bộ phận CNTT & Hạ tầng', N'Hạ tầng máy chủ, bảo mật, thiết bị viễn thông và phần mềm nghiệp vụ', 'DV01'),
('DT04', N'Khối Vận hành & Nông trường', N'Vật tư, bảo hộ lao động và thiết bị kỹ thuật phục vụ sản xuất thực địa', 'DV02'),
('DT05', N'Ban Lễ tân & Đối ngoại', N'Giao tế, khánh tiết, hội thảo và chăm sóc đối tác khách hàng', 'DV03');
GO

-- 5. Thêm CostGroups (Nhóm danh mục)
INSERT INTO dbo.CostGroups (MaNhom, TenNhom, MoTa, NhomCha, ThuTuHienThi) VALUES
('A', N'Tài sản, CCDC', N'Nhóm tổng hợp tài sản và công cụ dụng cụ toàn doanh nghiệp', NULL, 1),
('3002', N'CC-DC, Thiết bị văn phòng', N'Công cụ dụng cụ và trang thiết bị trang bị văn phòng', 'A', 2),
('3002-001', N'Nhóm Thiết bị điện tử văn phòng', N'Máy ảnh, flycam, máy chiếu, âm thanh, hội nghị', '3002', 3),
('3002-002', N'Nhóm Thiết bị điện gia dụng', N'Máy điều hòa, tủ lạnh, máy lọc nước, pantry', '3002', 4),
('3002-003', N'Nhóm Thiết bị tin học', N'Laptop, máy tính để bàn, máy in, mạng, phần mềm', '3002', 5),
('3002-004', N'Nhóm Nội thất văn phòng/CCDC', N'Bàn ghế, tủ hồ sơ, vách ngăn, khay ly, bảng tên', '3002', 6),
('3002-005', N'Nhóm Văn phòng phẩm, vật tư văn phòng', N'VPP, đồng phục, bánh kẹo tiếp khách, danh thiếp', '3002', 7),
('4003-001', N'Nhóm Phương tiện vận tải', N'Xe du lịch, bán tải, xe tải thùng, xe điện, xe máy', 'A', 8),
('C04', N'Nhóm Chi phí văn phòng và hỗ trợ công tác', N'Vé máy bay, khách sạn, taxi, cước viễn thông, bảo trì điện nước', NULL, 9),
('C02', N'Nhóm Chi phí giao tế', N'Thăm hỏi ốm đau, hiếu hỷ, quà tết, hoa chúc mừng', NULL, 10);
GO

-- 6. Thêm CostCatalog (Danh mục mặt hàng theo tài liệu)
INSERT INTO dbo.CostCatalog (MaChiPhi, MaNhom, TenDanhMuc, PhanLoai, DVT) VALUES
-- 3002-001: Nhóm Thiết bị điện tử văn phòng
('3002-001-0001', '3002-001', N'Máy ảnh', 'CC-DC', N'Cái'),
('3002-001-0002', '3002-001', N'Flycam', 'CC-DC', N'Cái'),
('3002-001-0003', '3002-001', N'Máy định vị GPS', 'CC-DC', N'Cái'),
('3002-001-0004', '3002-001', N'Bộ đàm', 'CC-DC', N'Bộ'),
('3002-001-0005', '3002-001', N'Webcam', 'CC-DC', N'Cái'),
('3002-001-0006', '3002-001', N'Đầu truyền hình', 'CC-DC', N'Cái'),
('3002-001-0007', '3002-001', N'Tivi', 'CC-DC', N'Cái'),
('3002-001-0008', '3002-001', N'Máy chiếu', 'CC-DC', N'Cái'),
('3002-001-0009', '3002-001', N'Màn hình LED', 'CC-DC', N'Cái'),
('3002-001-0010', '3002-001', N'Hệ thống âm thanh', 'CC-DC', N'Bộ'),
('3002-001-0011', '3002-001', N'Bộ họp trực tuyến', 'CC-DC', N'Bộ'),
('3002-001-0012', '3002-001', N'Máy phiên dịch', 'CC-DC', N'Cái'),
('3002-001-0013', '3002-001', N'Camera theo dõi', 'CC-DC', N'Cái'),
('3002-001-0014', '3002-001', N'Bảng điện tử phòng họp', 'CC-DC', N'Cái'),
('3002-001-0015', '3002-001', N'Điện thoại bàn', 'CC-DC', N'Cái'),
('3002-001-0016', '3002-001', N'Điện thoại di động', 'CC-DC', N'Cái'),
('3002-001-0017', '3002-001', N'Thiết bị điện tử khác', 'CC-DC', N'Cái'),

-- 3002-002: Nhóm Thiết bị điện gia dụng
('3002-002-001', '3002-002', N'Máy điều hòa', 'CC-DC', N'Cái'),
('3002-002-002', '3002-002', N'Tủ lạnh', 'CC-DC', N'Cái'),
('3002-002-003', '3002-002', N'Tủ đông', 'CC-DC', N'Cái'),
('3002-002-004', '3002-002', N'Máy nước nóng lạnh', 'CC-DC', N'Cái'),
('3002-002-005', '3002-002', N'Máy rửa/sấy ly', 'CC-DC', N'Cái'),
('3002-002-006', '3002-002', N'Máy lọc nước', 'CC-DC', N'Cái'),
('3002-002-007', '3002-002', N'Máy lọc không khí', 'CC-DC', N'Cái'),
('3002-002-008', '3002-002', N'Máy hút mùi quạt thông gió', 'CC-DC', N'Cái'),
('3002-002-009', '3002-002', N'Quạt', 'CC-DC', N'Cái'),
('3002-002-010', '3002-002', N'Thiết bị vệ sinh', 'CC-DC', N'Bộ'),
('3002-002-011', '3002-002', N'Thiết bị quầy bar - Coffee - Pantry', 'CC-DC', N'Bộ'),
('3002-002-012', '3002-002', N'Thiết bị điện khác', 'CC-DC', N'Cái'),

-- 3002-003: Nhóm Thiết bị tin học
('3002-003-0001', '3002-003', N'Laptop (máy tính xách tay)', 'CC-DC', N'Cái'),
('3002-003-0002', '3002-003', N'Máy vi tính để bàn (PC)', 'CC-DC', N'Bộ'),
('3002-003-0003', '3002-003', N'Màn hình vi tính', 'CC-DC', N'Cái'),
('3002-003-0004', '3002-003', N'Máy in', 'CC-DC', N'Cái'),
('3002-003-0005', '3002-003', N'Máy scan', 'CC-DC', N'Cái'),
('3002-003-0006', '3002-003', N'Máy in mã vạch', 'CC-DC', N'Cái'),
('3002-003-0007', '3002-003', N'Máy quét mã vạch', 'CC-DC', N'Cái'),
('3002-003-0008', '3002-003', N'Máy photocopy', 'CC-DC', N'Cái'),
('3002-003-0009', '3002-003', N'Máy hủy giấy', 'CC-DC', N'Cái'),
('3002-003-0010', '3002-003', N'Máy ép plastic', 'CC-DC', N'Cái'),
('3002-003-0011', '3002-003', N'Máy đóng lò xo', 'CC-DC', N'Cái'),
('3002-003-0012', '3002-003', N'Máy tính tiền', 'CC-DC', N'Cái'),
('3002-003-0013', '3002-003', N'Máy đo thân nhiệt máy chấm công', 'CC-DC', N'Cái'),
('3002-003-0014', '3002-003', N'Máy chủ Server', 'CC-DC', N'Cái'),
('3002-003-0015', '3002-003', N'Tủ rack, Switch, Router mạng', 'CC-DC', N'Bộ'),
('3002-003-0016', '3002-003', N'Thiết bị tin học khác', 'CC-DC', N'Cái'),

-- 3002-004: Nhóm Nội thất văn phòng/CCDC
('3002-004-0001', '3002-004', N'Bàn tổng giám đốc', 'CC-DC/TS', N'Cái'),
('3002-004-0002', '3002-004', N'Bàn phó tổng giám đốc', 'CC-DC/TS', N'Cái'),
('3002-004-0003', '3002-004', N'Bàn giám đốc chuyên môn', 'CC-DC/TS', N'Cái'),
('3002-004-0004', '3002-004', N'Bàn trưởng phó phòng', 'CC-DC/TS', N'Cái'),
('3002-004-0005', '3002-004', N'Bàn nhân viên 0.7 * 1.4m', 'CC-DC/TS', N'Cái'),
('3002-004-0006', '3002-004', N'Bàn họp lớn', 'CC-DC/TS', N'Cái'),
('3002-004-0007', '3002-004', N'Ghế văn phòng', 'CC-DC', N'Cái'),
('3002-004-0008', '3002-004', N'Tủ tài liệu hồ sơ', 'CC-DC', N'Cái'),
('3002-004-0009', '3002-004', N'Vách ngăn module làm việc', 'CC-DC', N'Bộ'),
('3002-004-0010', '3002-004', N'Bảng viết văn phòng', 'CC-DC', N'Cái'),

-- 3002-005: Nhóm Văn phòng phẩm
('3002-005-0001', '3002-005', N'Giấy in photo A4/A3', 'VATTU', N'Ram'),
('3002-005-0002', '3002-005', N'Bút bi, bút ký, bút dạ', 'VATTU', N'Hộp'),
('3002-005-0003', '3002-005', N'Bìa còng, file lưu hồ sơ', 'VATTU', N'Cái'),
('3002-005-0004', '3002-005', N'Mực in các loại', 'VATTU', N'Hộp'),

-- C04: Chi phí văn phòng & Hỗ trợ công tác
('C04-001', 'C04', N'Vé máy bay công tác', 'DICHVU', N'Vé'),
('C04-002', 'C04', N'Tiền phòng khách sạn lưu trú', 'DICHVU', N'Đêm'),
('C04-003', 'C04', N'Cước điện thoại, internet cáp quang', 'DICHVU', N'Tháng'),
('C04-004', 'C04', N'Nhiên liệu xăng dầu xe công', 'DICHVU', N'Lít'),

-- C02: Chi phí giao tế
('C02-001', 'C02', N'Thăm hỏi ốm đau thai sản', 'GIAOTE', N'Lần'),
('C02-002', 'C02', N'Quà tết đối tác khách hàng', 'GIAOTE', N'Phần'),
('C02-003', 'C02', N'Hoa chúc mừng lễ khởi công, khánh thành', 'GIAOTE', N'Lẵng');
GO

-- 7. Thêm Suppliers (Nhà cung cấp)
INSERT INTO dbo.Suppliers (MaNCC, TenNCC, MST, TenDanhMucHangHoa, SoDienThoai, DiaChi) VALUES
('NCC001', N'CÔNG TY CỔ PHẦN THƯƠNG MẠI NHÀ BÈ', '0301458921', N'CC-DC, Thiết bị văn phòng, Nội thất bàn ghế', '028.3872.9999', N'Số 400 Bến Nghé, Quận 7, TP. Hồ Chí Minh'),
('NCC002', N'CÔNG TY TNHH TÂN AN THÀNH', '0312548972', N'Thiết bị điện gia dụng, điều hòa không khí', '028.3755.8888', N'Số 125 Kinh Dương Vương, Quận 6, TP. Hồ Chí Minh'),
('NCC003', N'CÔNG TY CP THƯƠNG MẠI & DỊCH VỤ HÀNH TINH XANH', '0102948123', N'Thiết bị quầy bar, thiết bị vệ sinh, CCDC khác', '024.3789.6666', N'Tầng 4 Tòa nhà Hàn Việt, Hai Bà Trưng, Hà Nội'),
('NCC004', N'CÔNG TY CỔ PHẦN THẾ GIỚI GIẤY', '0309876543', N'Văn phòng phẩm, giấy in văn phòng, vật tư', '028.7306.3979', N'Số 76 Đường 13, Bình Hưng Hòa, Bình Tân, TP. Hồ Chí Minh'),
('NCC005', N'CÔNG TY TNHH THƯƠNG MẠI SÀI GÒN - GIA LAI (CO.OP)', '5900345678', N'Bánh, kẹo, trà, café phục vụ hội họp, nước uống', '0269.3876.123', N'Số 21 Cách Mạng Tháng Tám, Pleiku, Gia Lai'),
('NCC006', N'CÔNG TY TNHH ZACOM VIỆT NAM', '0315789123', N'Thiết bị tin học, laptop, máy in, mạng internet', '028.6291.5555', N'Số 58/12 Đồng Nai, Quận 10, TP. Hồ Chí Minh'),
('NCC007', N'CÔNG TY TNHH MỸ THUẬT SẢN XUẤT THƯƠNG MẠI SÀI GÒN', '0314561234', N'Logo THACO AGRI quầy lễ tân, biển hiệu chỉ dẫn', '028.3999.4455', N'Số 89 Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh'),
('NCC008', N'TẬP ĐOÀN BƯU CHÍNH VIỄN THÔNG VIỆT NAM (VNPT)', '0100684378', N'Dịch vụ cước viễn thông, internet cáp quang', '18001166', N'Số 57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội');
GO

-- 8. Thêm 8 giao dịch mẫu (Tổng cộng đúng 149.777.777 đ trong Tháng 10/2026 theo trang 2-3 tài liệu)
INSERT INTO dbo.Expenses (
    MaGiaoDich, NgayPhatSinh, SoChungTu, MaDanhMucChiPhi, PhanLoai, DienGiai,
    MaDonVi, MaDoiTuong, MaNCC, SoTien, NguoiPhuTrach, TrangThai
) VALUES
('EXP-202610-001', '2026-10-05', N'HD-NB-8891', '3002-004-0005', 'CC-DC/TS', N'Trang bị cụm bàn làm việc cho khối chuyên viên mở rộng', 'DV01', 'DT02', 'NCC001', 22222222.00, 'NV002', N'DA_DUYET'),
('EXP-202610-002', '2026-10-08', N'HD-NB-8895', '3002-001-0001', 'CC-DC', N'Mua sắm máy ảnh tác nghiệp truyền thông sự kiện', 'DV01', 'DT01', 'NCC001', 20000000.00, 'NV001', N'DA_DUYET'),
('EXP-202610-003', '2026-10-12', N'HD-TAT-1029', '3002-002-001', 'CC-DC', N'Lắp đặt 02 máy điều hòa Inverter phòng họp hội nghị', 'DV03', 'DT01', 'NCC002', 34000000.00, 'NV001', N'DA_DUYET'),
('EXP-202610-004', '2026-10-15', N'HD-HTX-4512', '3002-002-011', 'CC-DC', N'Thiết bị quầy bar, cây xanh văn phòng và thùng rác phân loại', 'DV02', 'DT04', 'NCC003', 33333333.00, 'NV002', N'DA_DUYET'),
('EXP-202610-005', '2026-10-18', N'HD-TGG-6678', '3002-005-0001', 'VATTU', N'Mua văn phòng phẩm, giấy in và vật tư văn phòng đợt 4', 'DV01', 'DT01', 'NCC004', 22222222.00, 'NV001', N'DA_DUYET'),
('EXP-202610-006', '2026-10-22', N'HD-COOP-891', '3002-002-011', 'CC-DC', N'Mua bánh kẹo, trà, café và nước suối phục vụ hội nghị giao ban', 'DV02', 'DT05', 'NCC005', 10000000.00, 'NV002', N'DA_DUYET'),
('EXP-202610-007', '2026-10-25', N'HD-ZA-3341', '3002-003-0016', 'CC-DC', N'Thiết bị tin học, chuột, bàn phím và RAM nâng cấp máy tính', 'DV03', 'DT03', 'NCC006', 5000000.00, 'NV003', N'DA_DUYET'),
('EXP-202610-028', '2026-10-28', N'HD-MT-5561', '3002-004-0010', 'CC-DC', N'Gia công logo THACO AGRI quầy lễ tân và biển chỉ dẫn các ban', 'DV03', 'DT05', 'NCC007', 3000000.00, 'NV001', N'DA_DUYET');
GO

-- ==========================================================================================
-- CÁC VIEW BÁO CÁO TỔNG HỢP (Views)
-- ==========================================================================================

-- VIEW 1: BÁO CÁO MA TRẬN 12 THÁNG THEO DANH MỤC HÀNG HÓA/DỊCH VỤ (Theo mẫu PDF)
CREATE OR ALTER VIEW dbo.vw_BaoCaoChiPhi_12Thang_TheoHangHoa
AS
WITH ChiPhiThang AS (
    SELECT 
        e.MaDanhMucChiPhi,
        c.TenDanhMuc,
        g.MaNhom,
        g.TenNhom,
        c.PhanLoai,
        MONTH(e.NgayPhatSinh) AS Thang,
        YEAR(e.NgayPhatSinh) AS Nam,
        e.SoTien
    FROM dbo.Expenses e
    INNER JOIN dbo.CostCatalog c ON e.MaDanhMucChiPhi = c.MaChiPhi
    INNER JOIN dbo.CostGroups g ON c.MaNhom = g.MaNhom
)
SELECT 
    MaDanhMucChiPhi,
    TenDanhMuc,
    MaNhom,
    TenNhom,
    PhanLoai,
    Nam,
    ISNULL([1], 0) AS Thang01,
    ISNULL([2], 0) AS Thang02,
    ISNULL([3], 0) AS Thang03,
    ISNULL([4], 0) AS Thang04,
    ISNULL([5], 0) AS Thang05,
    ISNULL([6], 0) AS Thang06,
    ISNULL([7], 0) AS Thang07,
    ISNULL([8], 0) AS Thang08,
    ISNULL([9], 0) AS Thang09,
    ISNULL([10], 0) AS Thang10,
    ISNULL([11], 0) AS Thang11,
    ISNULL([12], 0) AS Thang12,
    (ISNULL([1],0) + ISNULL([2],0) + ISNULL([3],0) + ISNULL([4],0) +
     ISNULL([5],0) + ISNULL([6],0) + ISNULL([7],0) + ISNULL([8],0) +
     ISNULL([9],0) + ISNULL([10],0) + ISNULL([11],0) + ISNULL([12],0)) AS TongCongNam
FROM ChiPhiThang
PIVOT (
    SUM(SoTien)
    FOR Thang IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12])
) AS BangPivot;
GO

-- VIEW 2: BÁO CÁO CHI PHÍ THEO ĐƠN VỊ CHỊU CHI PHÍ
CREATE OR ALTER VIEW dbo.vw_BaoCaoChiPhi_TheoDonVi
AS
SELECT 
    u.MaDonVi,
    u.TenDonVi,
    u.TenDayDu,
    COUNT(e.ID) AS SoGiaoDich,
    ISNULL(SUM(e.SoTien), 0) AS TongChiPhiVND
FROM dbo.CostUnits u
LEFT JOIN dbo.Expenses e ON u.MaDonVi = e.MaDonVi
GROUP BY u.MaDonVi, u.TenDonVi, u.TenDayDu;
GO

-- VIEW 3: BÁO CÁO CHI PHÍ THEO NHÀ CUNG CẤP (TOP NHÀ THẦU)
CREATE OR ALTER VIEW dbo.vw_BaoCaoChiPhi_TheoNCC
AS
SELECT 
    s.MaNCC,
    s.TenNCC,
    s.MST,
    COUNT(e.ID) AS SoLanMuaHang,
    ISNULL(SUM(e.SoTien), 0) AS TongGiaTriMuaHangVND
FROM dbo.Suppliers s
LEFT JOIN dbo.Expenses e ON s.MaNCC = e.MaNCC
GROUP BY s.MaNCC, s.TenNCC, s.MST;
GO

-- ==========================================================================================
-- STORED PROCEDURES HỖ TRỢ NGHIỆP VỤ (Thêm mới, tính toán)
-- ==========================================================================================

-- PROCEDURE: Thêm mới chi phí tự động sinh mã EXP-YYYYMM-XXX
CREATE OR ALTER PROCEDURE dbo.sp_ThemMoiChiPhi
    @NgayPhatSinh DATE,
    @SoChungTu NVARCHAR(50),
    @MaDanhMucChiPhi VARCHAR(50),
    @DienGiai NVARCHAR(500),
    @MaDonVi VARCHAR(20),
    @MaDoiTuong VARCHAR(20),
    @MaNCC VARCHAR(20),
    @SoTien DECIMAL(18,2),
    @NguoiPhuTrach VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Prefix VARCHAR(15) = 'EXP-' + FORMAT(@NgayPhatSinh, 'yyyyMM') + '-';
    DECLARE @NextNum INT;
    
    SELECT @NextNum = ISNULL(MAX(CAST(RIGHT(MaGiaoDich, 3) AS INT)), 0) + 1
    FROM dbo.Expenses
    WHERE MaGiaoDich LIKE @Prefix + '%';

    DECLARE @MaGiaoDich VARCHAR(30) = @Prefix + RIGHT('000' + CAST(@NextNum AS VARCHAR(3)), 3);

    DECLARE @PhanLoai VARCHAR(20);
    SELECT @PhanLoai = PhanLoai FROM dbo.CostCatalog WHERE MaChiPhi = @MaDanhMucChiPhi;

    INSERT INTO dbo.Expenses (
        MaGiaoDich, NgayPhatSinh, SoChungTu, MaDanhMucChiPhi,
        PhanLoai, DienGiai, MaDonVi, MaDoiTuong, MaNCC,
        SoTien, NguoiPhuTrach, TrangThai
    )
    VALUES (
        @MaGiaoDich, @NgayPhatSinh, @SoChungTu, @MaDanhMucChiPhi,
        @PhanLoai, @DienGiai, @MaDonVi, @MaDoiTuong, @MaNCC,
        @SoTien, @NguoiPhuTrach, N'DA_DUYET'
    );

    SELECT @MaGiaoDich AS MaChiPhiMoi, @@ROWCOUNT AS SoDongAnhHuong;
END;
GO

-- KIỂM TRA NHANH TỔNG SỐ TIỀN VÀ BẢN GHI VỪA KHỞI TẠO
SELECT 
    COUNT(*) AS TongSoChungTu, 
    SUM(SoTien) AS TongChiPhiPhatSinhVND 
FROM dbo.Expenses;
GO

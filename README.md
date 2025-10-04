# API Jobb Service

โครงการบริการข้อมูลผู้สมัครและนายจ้างที่พัฒนาด้วย ASP.NET Core 9 (Web API) และฐานข้อมูล MySQL ผ่าน Entity Framework Core พร้อมการยืนยันตัวตนด้วย JWT

## โครงสร้างหลักของโปรเจกต์
- `api-jobb-service.sln` : ไฟล์ Solution สำหรับเปิดด้วย Visual Studio / Rider / VS Code
- `workapp/Program.cs` : จุดเริ่มต้นของ Web API การลงทะเบียนบริการ, JWT Authentication และ CORS (อนุญาต `http://localhost:3000`)
- `workapp/models` : โมเดลข้อมูล เช่น `User`, `Job`, `AppDbContext` และไฟล์ Migration
- `workapp/features/auth/AuthController.cs` : สมัครสมาชิกและเข้าสู่ระบบ (คืน JWT token เมื่อเข้าสู่ระบบ)
- `workapp/features/job/JobsController.cs` : จัดการ CRUD ของประกาศงาน และการเปลี่ยนสถานะอนุมัติ (เฉพาะแอดมิน)
- `workapp/docker-compose.yml` : ตัวช่วยตั้งค่าฐานข้อมูล MySQL แบบรวดเร็วด้วย Docker
- `workapp/appsettings.json` : ค่าเชื่อมต่อฐานข้อมูลและคีย์ที่ใช้เซ็น JWT

## สิ่งที่ต้องเตรียม
1. [.NET SDK 9.0](https://dotnet.microsoft.com/) หรือใหม่กว่า
2. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ถ้าต้องการใช้ MySQL จาก docker-compose)
3. เครื่องมือจัดการฐานข้อมูล MySQL (เช่น MySQL Workbench, TablePlus) เพื่อดูข้อมูลได้สะดวก
4. (แนะนำ) ติดตั้งเครื่องมือ `dotnet-ef` เพื่อจัดการคำสั่ง Migrations
   ```bash
   dotnet tool install --global dotnet-ef
   ```

## ขั้นตอนการตั้งค่า
1. **ติดตั้งแพ็กเกจและคอมไพล์**
   ```bash
   dotnet restore
   dotnet build
   ```
2. **ปรับไฟล์ตั้งค่า**
   - แก้ `ConnectionStrings:DefaultConnection` ใน `workapp/appsettings.json` ให้ตรงกับฐานข้อมูลของคุณ
   - กำหนดค่าในส่วน `Jwt` ให้เป็นคีย์ลับ, ผู้ออก (Issuer) และผู้รับ (Audience) ของโปรเจกต์คุณเอง
3. **เตรียมฐานข้อมูล**
   - ถ้าใช้ Docker ให้รัน:
     ```bash
     cd workapp
     docker compose up -d
     ```
     ค่าเริ่มต้นจะสร้างฐานข้อมูล `myapp_db` พร้อมผู้ใช้ `myuser/mypassword`
   - ถ้าเพิ่งเพิ่มโมเดล/แก้ไขโครงสร้างฐานข้อมูล ให้สร้าง Migration ใหม่ (ตัวอย่างสำหรับตารางงาน):
     ```bash
     dotnet ef migrations add CreateJobsTable --project workapp
     ```
   - จากนั้นอัปเดตฐานข้อมูลให้ตรงกับ Migration ล่าสุด
     ```bash
     dotnet ef database update --project workapp
     ```
4. **รันแอปพลิเคชัน**
   ```bash
   dotnet run --project workapp
   ```
   หรือให้คอมไพล์ใหม่อัตโนมัติเมื่อไฟล์เปลี่ยน
   ```bash
   dotnet watch --project workapp run
   ```
5. **ทดสอบ API**
   - เซิร์ฟเวอร์ดีฟอลต์จะเปิดที่ `https://localhost:7000` และ `http://localhost:5000` (ค่าจริงดูจากคอนโซล)
   - สามารถใช้ไฟล์ `workapp/workapp.http` ร่วมกับ VS Code/REST Client หรือใช้ Postman ก็ได้

## การพิสูจน์ตัวตน & JWT
- `POST /api/auth/login` จะคืน JWT token พร้อมข้อมูลผู้ใช้ (ไม่รวม password hash)
- ทุกคำขอที่ต้องการสิทธิ์เพิ่มเติม (เช่น API สำหรับแอดมินในอนาคต) ให้ใส่เฮดเดอร์:
  ```text
  Authorization: Bearer <token>
  ```
- Token ที่สร้างมีอายุ 2 ชั่วโมง (แก้ไขได้ใน `AuthController.GenerateJwtToken`)
- หากมีการหมุนคีย์ (`Jwt:Key`) หรือเปลี่ยน `Issuer/Audience` ให้ทำกับทั้ง API และฝั่ง Client

## API หลักที่มีให้ใช้งาน
- **สมัครสมาชิก** – `POST /api/auth/register`  
  ส่ง `name`, `email`, `password`, `role` (ดีฟอลต์ `normal`) เพื่อสร้างผู้ใช้ใหม่ ระบบเช็คเมลซ้ำและแฮชรหัสผ่านก่อนบันทึก
- **เข้าสู่ระบบ** – `POST /api/auth/login`  
  ส่ง `email` และ `password` เพื่อเข้าสู่ระบบ ระบบจะตรวจสอบรหัสผ่านและคืน JWT token พร้อมข้อมูลผู้ใช้
- **อ่านประกาศงาน** – `GET /api/jobs`  
  ผู้ใช้ทั่วไปเห็นเฉพาะงานที่ `IsApproved = true` ส่วนแอดมินเห็นทุกงาน (แนบเฮดเดอร์ `X-User-Role: admin`)
- **ดูรายละเอียดงาน** – `GET /api/jobs/{id}`  
  ผู้ใช้ทั่วไปดูได้เฉพาะงานที่อนุมัติแล้ว แอดมินดูได้ทั้งหมด
- **สร้างงานใหม่** – `POST /api/jobs`  
  รับ `title`, `description`, `company`, `location` และเลือกตั้ง `isApproved` ได้เฉพาะเมื่อส่งด้วยบทบาทแอดมินผ่าน `X-User-Role`
- **แก้ไขงาน** – `PUT /api/jobs/{id}`  
  ปรับรายละเอียดได้ทุกบทบาท แต่การแก้ค่า `isApproved` จะถูกปฏิเสธหากไม่ใช่แอดมิน
- **เปลี่ยนสถานะอนุมัติงาน** – `PUT /api/jobs/{id}/status`  
  สำหรับแอดมินเท่านั้น ใช้เปลี่ยนค่า `isApproved`
- **ลบงาน** – `DELETE /api/jobs/{id}`  
  การลบต้องเป็นแอดมิน

> หมายเหตุ: ขณะนี้ระบบแยกบทบาทการจัดการงานผ่านเฮดเดอร์ `X-User-Role` เพื่อความสะดวกในการทดสอบ หากมีการเพิ่ม Middleware ตรวจสอบ JWT + Role อย่างจริงจัง สามารถย้ายตรรกะตรวจสอบสิทธิ์จากคอนโทรลเลอร์มาใช้ `[Authorize(Roles="admin")]` ได้ทันที

## เคล็ดลับการพัฒนา
- ใช้คำสั่ง `dotnet ef migrations add <Name>` เพื่อสร้าง Migration ใหม่เมื่อโมเดลเปลี่ยน และอย่าลืม `dotnet ef database update` ทุกครั้งหลังสร้าง Migration
- หากต้องการ Seed ข้อมูลเริ่มต้น อาจสร้างไฟล์ SQL ในโฟลเดอร์ `workapp/init.sql/`
- ขณะดีบัก ถ้า API ไม่ตอบกลับ ให้เช็ก Log ในคอนโซลหรือใช้ `dotnet watch run` เพื่อตรวจการคอมไพล์ทันที
- หากแก้ไขค่าสภาพแวดล้อม ให้สร้างไฟล์ `appsettings.Development.json` แล้ว override ค่าเฉพาะสภาพแวดล้อมนั้น ๆ

## การรันทดสอบ (ถ้ามี)
ปัจจุบันโปรเจกต์ยังไม่มีชุดทดสอบอัตโนมัติ แนะนำให้สร้างโฟลเดอร์ `tests/` พร้อมโปรเจกต์ xUnit หรือ NUnit เพื่อรองรับการทดสอบในอนาคต

## ทรัพยากรเพิ่มเติม
- [ASP.NET Core Web API Documentation](https://learn.microsoft.com/aspnet/core/web-api/)
- [Entity Framework Core MySQL Provider (Pomelo)](https://github.com/PomeloFoundation/Pomelo.EntityFrameworkCore.MySql)
- [EF Core Migrations Overview](https://learn.microsoft.com/ef/core/managing-schemas/migrations/)
- [JWT Authentication in ASP.NET Core](https://learn.microsoft.com/aspnet/core/security/authentication/jwt)


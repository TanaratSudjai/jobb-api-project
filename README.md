# API Jobb Service

โครงการบริการข้อมูลผู้สมัครและนายจ้างที่พัฒนาด้วย ASP.NET Core 9 (Web API) และฐานข้อมูล MySQL ผ่าน Entity Framework Core

## โครงสร้างหลักของโปรเจกต์
- `api-jobb-service.sln` : ไฟล์ Solution สำหรับเปิดด้วย Visual Studio / Rider / VS Code
- `workapp/Program.cs` : จุดเริ่มต้นของ Web API และการลงทะเบียนบริการ
- `workapp/models` : โมเดลข้อมูล (`User`, `AppDbContext`) และ Migration
- `workapp/fetures/auth/AuthController.cs` : ควบคุมการสมัครสมาชิกและเข้าสู่ระบบ
- `workapp/docker-compose.yml` : ตัวช่วยตั้งค่าฐานข้อมูล MySQL แบบรวดเร็วด้วย Docker
- `workapp/appsettings.json` : ค่าเชื่อมต่อฐานข้อมูลและการตั้งค่าทั่วไปของแอป

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
2. **เตรียมฐานข้อมูล**
   - ปรับค่า `ConnectionStrings:DefaultConnection` ใน `workapp/appsettings.json` ให้ตรงกับฐานข้อมูลของคุณ
   - ถ้าใช้ Docker ให้รัน:
     ```bash
     cd workapp
     docker compose up -d
     ```
     ค่าเริ่มต้นจะสร้างฐานข้อมูล `myapp_db` พร้อมผู้ใช้ `myuser/mypassword`
   - สร้างตารางตาม Migration ล่าสุด
     ```bash
     dotnet ef database update --project workapp
     ```
3. **รันแอปพลิเคชัน**
   ```bash
   dotnet run --project workapp
   ```
   หรือให้คอมไพล์ใหม่อัตโนมัติเมื่อไฟล์เปลี่ยน
   ```bash
   dotnet watch --project workapp run
   ```
4. **ทดสอบ API**
   - เซิร์ฟเวอร์ดีฟอลต์จะเปิดที่ `https://localhost:7000` และ `http://localhost:5000` (ค่าจริงดูจากคอนโซล)
   - สามารถใช้ไฟล์ `workapp/workapp.http` ร่วมกับ VS Code/REST Client หรือใช้ Postman ก็ได้

## โฟลว์การทำงานของระบบ (เบื้องต้น)
1. **สมัครสมาชิก** – `POST /api/auth/register`
   - รับข้อมูล `name`, `email`, `password`, `role`
   - ระบบเช็คอีเมลซ้ำ, แฮชรหัสผ่านด้วย SHA256 และบันทึกผู้ใช้ใหม่ในตาราง `Users`
   - ส่งกลับ `userId` และข้อความสำเร็จ
2. **เข้าสู่ระบบ** – `POST /api/auth/login`
   - รับ `email` และ `password`
   - ระบบดึงข้อมูลผู้ใช้จากฐานข้อมูล เปรียบเทียบรหัสผ่านด้วยการแฮชแบบเดียวกับตอนสมัคร
   - ส่งกลับข้อมูลผู้ใช้และข้อความเข้าสู่ระบบสำเร็จ (ยังไม่สร้าง JWT)
3. **ขยายเพิ่มเติม** (แนะนำสำหรับสปรินต์ถัดไป)
   - ออกแบบ JWT Token และ Refresh Token เพื่อรักษาความปลอดภัย
   - แยก Role `seeker` / `employer` และกำหนดสิทธิ์การเข้าถึง API
   - สร้าง Feature สำหรับประกาศงาน, สมัครงาน, และจัดการโปรไฟล์

## เคล็ดลับการพัฒนา
- ใช้คำสั่ง `dotnet ef migrations add <Name>` เพื่อสร้าง Migration ใหม่เมื่อโมเดลเปลี่ยน
- เก็บไฟล์ SQL สำหรับเตรียมข้อมูลเริ่มต้นในโฟลเดอร์ `workapp/init.sql/`
- ขณะดีบัก ถ้า API ไม่ตอบกลับ ให้เช็ก Log ในคอนโซลหรือใช้ `dotnet watch run` เพื่อตรวจการคอมไพล์ทันที
- หากแก้ไขค่าสภาพแวดล้อม ให้สร้างไฟล์ `appsettings.Development.json` แล้ว override ค่าเฉพาะสภาพแวดล้อมนั้น ๆ

## การรันทดสอบ (ถ้ามี)
ปัจจุบันโปรเจกต์ยังไม่มีชุดทดสอบอัตโนมัติ แนะนำให้สร้างโฟลเดอร์ `tests/` พร้อมโปรเจกต์ xUnit หรือ NUnit เพื่อรองรับการทดสอบในอนาคต

## ทรัพยากรเพิ่มเติม
- [ASP.NET Core Web API Documentation](https://learn.microsoft.com/aspnet/core/web-api/)
- [Entity Framework Core MySQL Provider (Pomelo)](https://github.com/PomeloFoundation/Pomelo.EntityFrameworkCore.MySql)
- [EF Core Migrations Overview](https://learn.microsoft.com/ef/core/managing-schemas/migrations/)


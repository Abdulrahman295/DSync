# DSync

<div align="center">
  <img src="https://github.com/user-attachments/assets/c326147f-dab7-447e-b783-286a74b817ea" alt="Dsync Logo"/>
  <p align="center">🗃️☁️ A CLI tool for backing up MySQL, PostgreSQL or MongoDB databases to cloud storage services like Google Drive or Amazon S3. It automates the backup process and notifies users of backup status via email. 📧</p>
   <p align="center">
      <img src="https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/>
      <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
      <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
      <img src="https://img.shields.io/badge/Google%20Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white" alt="Google Drive"/>
      <img src="https://img.shields.io/badge/Amazon%20S3-FFA500?style=for-the-badge&logo=amazons3&logoColor=white" alt="Amazon S3"/>
      <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
   </p>
</div>

  
## 📑 Table of Contents
- [Features](#-features)
- [Architecture](#️-architecture)
- [Prerequisites](#️-prerequisites)
- [Installation](#️-installation)
- [Setup](#️-setup)
- [Usage](#-usage)
- [License](#-license)


## ✨ Features
- **Backup Management** - Database backup and restoration support for:
    - MySQL
    - MongoDB
    - PostgreSQL
- **Compression** - Reduce storage requirements with backup compression.
- **Security** - Protect sensitive data with encryption, ensuring secure storage. 
- **Flexible scheduling** - Set custom backup frequencies to suit your needs.
- **Cloud Storage Integration** - Automatically sync local backups to your preferred remote storage:
    - Google Drive
    - AWS S3
- **Status notifications** - Receive daily email reports on successful and failed backups.

## ⚙️ Architecture
![image](https://github.com/user-attachments/assets/6a4ed3fd-e73a-477b-97f7-dd801ff30578)


## ☑️ Prerequisites
- Node.js (version 14 or higher)
- npm (version 6 or higher)


## 🗺️ Installation
1) Clone this repo:
```Bash
git clone https://github.com/Abdulrahman295/DSync.git
cd DSync
```

2) Install Dependencies:
```Bash
npm install
```
   
3) Run the application:
```Bash
npm start -- <command> <options>
```

## 🛠️ Setup
Before using DSync, you need to set up your database, cloud storage, and email configurations.

### Database Configuration
DSync requires a config file to connect to a database. Create a YAML file (e.g., `database_config.yml`) with the following structure:

```yaml
host: "localhost"
port: "3306"
user: "root"
password: "your_password"
database: "your_database_name"
```

Adjust the values according to your database setup. Use this file for the config option in DSync commands


### Cloud Storage Configuration

#### Google Drive
DSync uses a service account for Google Drive API authentication. Follow these steps to create a service account:
1. Visit the [Google Cloud Console](https://console.developers.google.com) and create or select a project.
2. Go to the [Credentials](https://console.developers.google.com/apis/credentials) page and create a service account key.
3. Download the JSON file containing your service account key.
4. Enable the [Google Drive API](https://console.developers.google.com/apis/api/drive.googleapis.com) for your project.
5. Share your Google Drive folder with the service account's email (found in the `client_email` field of the JSON file).
   
Use this key file for the key option and the shared folder ID for the destination option in DSync commands.

#### AWS S3
DSync requires `aws_access_key_id` and `aws_secret_access_key` for authentication to use the AWS S3 API. To create a local SDK credentials file:
1. Follow the instructions in [this blog](https://aws.amazon.com/blogs/security/wheres-my-secret-access-key/) to obtain `aws_access_key_id` and `aws_secret_access_key` for your AWS account.
2. Create a file named `credentials.json` in your local system and copy the values from your AWS account page to it, the file should have the following structure:
    ```json
    {
      "accessKeyId": "",
      "secretAccessKey": ""
    }
    ```
    
Use this file for the key option in DSync commands.

### Mail Configuration
To use your email for sending daily reports:
1. Follow [these steps](https://knowledge.workspace.google.com/kb/how-to-create-app-passwords-000009237) to create an app password for your email account.
2. Create a `.env` file in the root directory of DSync and add the following variables:

   ```env
   EMAIL=your_email_account
   PASSWORD=your_app_password
   ```

This setup will allow DSync to send email notifications using your account.

## 💡 Usage
DSync provides several commands to manage database backups, restorations, and scheduling. Here's how to use them:

### Backup

Create a backup of your database:

```bash
dsync backup -c <config_path> -t <database_type> -o <output_path> [-z] [-e]
```

Options:
- `-c, --config <path>`: Path to the config file (required)
- `-t, --type <type>`: Type of database (mysql, postgresql, mongodb) (required)
- `-o, --output <path>`: Path to save the backup (required)
- `-z, --zip`: Compress the backup
- `-e, --encrypt`: Encrypt the backup

### Restore

Restore a database from a backup file:

```bash
dsync restore -f <backup_file> [-c <config_path>] [-t <database_type>] [-o <output_path>] [--no-direct]
```

Options:
- `-f, --file <path>`: Path to the backup file (required)
- `-c, --config <path>`: Path to database config file
- `-t, --type <type>`: Type of database (mysql, postgresql, mongodb)
- `-o, --output <path>`: Output path for the SQL dump (if not restoring directly)
- `--no-direct`: Do not restore directly to the database, create SQL dump instead

### Upload

Upload a backup to S3 or Google Drive:

```bash
dsync upload -f <file_path> -k <key_path> -d <destination> -t <upload_type> [-r <region>]
```

Options:
- `-f, --file <path>`: Path to the backup file (required)
- `-k, --key <path>`: Path to credentials JSON file (required)
- `-d, --destination <dest>`: S3 bucket name or Google Drive folder ID (required)
- `-t, --type <type>`: Upload type: 's3' or 'drive' (required)
- `-r, --region <region>`: AWS region for S3 upload (default: "us-east-1")

### Schedule

Set up regular backup schedules:

```bash
dsync schedule -i <cron_interval> -c <config_path> -t <database_type> -o <output_path> [-z] [-e] [-u <upload_type>] [-k <key_path>] [-d <destination>] [-m <email>] [-r <region>]
```

Options:
- `-i, --interval <cron>`: Cron expression for scheduling the backup (required)
- `-c, --config <path>`: Path to database config file (required)
- `-t, --type <type>`: Type of database (mysql, postgresql, mongodb) (required)
- `-o, --output <path>`: Path to save the backup (required)
- `-z, --zip`: Compress the backup
- `-e, --encrypt`: Encrypt the backup
- `-u, --upload <type>`: Upload type: 's3' or 'drive'
- `-k, --key <path>`: Path to credentials JSON file
- `-d, --destination <dest>`: S3 bucket name or Google Drive folder ID
- `-m, --mail <recipient mail>`: Email address to send daily reports to
- `-r, --region <region>`: AWS region for S3 upload (default: "us-east-1")

### Manage Scheduler

Control the backup scheduler service:

```bash
dsync stop-scheduler    # Stop the scheduler service
dsync resume-scheduler  # Resume the scheduler service
dsync remove-scheduler  # Remove the scheduler service
```


## 📰 License
This project is licensed under the MIT License. See the `LICENSE` file for more details.

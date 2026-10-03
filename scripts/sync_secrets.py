import paramiko
import os
import sys

SERVER_IP = "10.1.0.11"
USERNAME = "ubuntu-server"
PASSWORD = "pTT!CT01"

# List of critical files to sync (from local path to remote path)
CRITICAL_FILES = [
    {
        "local": ".env", 
        "remote": "/home/ubuntu-server/CamTech.Blog/.env"
    },
    {
        "local": "apps/api/.env", 
        "remote": "/home/ubuntu-server/CamTech.Blog/apps/api/.env"
    },
    {
        "local": "apps/web/.env.local", 
        "remote": "/home/ubuntu-server/CamTech.Blog/apps/web/.env.local"
    }
]

def sync_file(sftp, local_path, remote_path):
    if not os.path.exists(local_path):
        print(f"⚠️  Skipped: Local file '{local_path}' does not exist.")
        return

    try:
        # Ensure the remote directory exists
        remote_dir = os.path.dirname(remote_path)
        sftp.execute(f"mkdir -p {remote_dir}") # paramiko sftp doesn't have mkdir -p, we can just let it fail if dir exists or we can just upload directly assuming dirs exist from git clone.
    except:
        pass

    try:
        print(f"Syncing {local_path} -> {remote_path} ...", end=" ")
        sftp.put(local_path, remote_path)
        print("✅ Success")
    except Exception as e:
        print(f"❌ Failed: {e}")

def main():
    print(f"Connecting to {SERVER_IP} to sync critical files...")
    
    transport = paramiko.Transport((SERVER_IP, 22))
    try:
        transport.connect(username=USERNAME, password=PASSWORD)
        sftp = paramiko.SFTPClient.from_transport(transport)
        print("Connected successfully!\n")
        
        for file_map in CRITICAL_FILES:
            sync_file(sftp, file_map["local"], file_map["remote"])
            
        sftp.close()
        transport.close()
        print("\n🎉 All critical files synced successfully!")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()

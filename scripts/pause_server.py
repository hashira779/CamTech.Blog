import paramiko

SERVER_IP = "10.1.0.11"
USERNAME = "ubuntu-server"
PASSWORD = "pTT!CT01"

def run_cmd(ssh, cmd, title):
    print(f"\n{'='*50}\n>>> {title}\n{cmd}\n{'='*50}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    for line in stdout:
        print(line, end="")
    err = stderr.read().decode()
    if err:
        print(f"STDERR: {err}")

def main():
    print(f"Connecting to {SERVER_IP}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        print("Connected successfully!")
        
        # 1. Start CamTech.Blog (which was accidentally paused)
        run_cmd(ssh, "cd /home/ubuntu-server/CamTech.Blog && docker compose start", "Starting CamTech.Blog")
        
        # 2. Stop CamTech (CamTech Tools with n8n, video downloader, etc.)
        run_cmd(ssh, "cd /home/ubuntu-server/CamTech && docker compose stop", "Stopping CamTech Tools")
        
        # Check running containers
        run_cmd(ssh, "docker ps --format '{{.Names}}'", "Running Containers")
        
        ssh.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()

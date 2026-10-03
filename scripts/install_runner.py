import paramiko

SERVER_IP = "10.1.0.11"
USERNAME = "ubuntu-server"
PASSWORD = "pTT!CT01"

def run_cmd(ssh, cmd, title):
    print(f"\n{'='*50}\n>>> {title}\n{cmd}\n{'='*50}")
    # For sudo commands we need a pty and to pass the password, but we'll use echo password | sudo -S
    if "sudo " in cmd:
        cmd = f"echo '{PASSWORD}' | sudo -S {cmd.replace('sudo ', '')}"
    
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=120)
    for line in stdout:
        print(line, end="")
    
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0:
        print(f"❌ Command failed with exit status {exit_status}")
    else:
        print("✅ Success")

def main():
    print(f"Connecting to {SERVER_IP} to install GitHub Actions Runner...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        print("Connected successfully!")
        
        # 1. Create directory and download runner
        cmd_download = (
            "mkdir -p /home/ubuntu-server/actions-runner && "
            "cd /home/ubuntu-server/actions-runner && "
            "curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz" # Using standard generic download or we can use the exact one from image
        )
        
        cmd_download = (
            "mkdir -p /home/ubuntu-server/actions-runner && "
            "cd /home/ubuntu-server/actions-runner && "
            "curl -o actions-runner-linux-x64-2.337.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.337.0/actions-runner-linux-x64-2.337.0.tar.gz && "
            "tar xzf ./actions-runner-linux-x64-2.337.0.tar.gz"
        )
        run_cmd(ssh, cmd_download, "Downloading and Extracting Runner")
        
        # 2. Configure the runner
        # --unattended skips interactive prompts
        # --replace replaces an existing runner with the same name if any
        cmd_config = (
            "cd /home/ubuntu-server/actions-runner && "
            "./config.sh --url https://github.com/hashira779/CamTech.Blog "
            "--token BSGAGAQRCYTNFZXDCISXWW3KYD4YU --unattended --replace"
        )
        run_cmd(ssh, cmd_config, "Configuring GitHub Runner")
        
        # 3. Install and start as a service
        cmd_service = (
            "cd /home/ubuntu-server/actions-runner && "
            "sudo ./svc.sh install && "
            "sudo ./svc.sh start"
        )
        run_cmd(ssh, cmd_service, "Installing and Starting Runner Service")
        
        # 4. Check status
        run_cmd(ssh, "cd /home/ubuntu-server/actions-runner && sudo ./svc.sh status", "Checking Runner Service Status")
        
        ssh.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()

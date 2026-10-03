import paramiko

SERVER_IP = "10.1.0.11"
USERNAME = "ubuntu-server"
PASSWORD = "pTT!CT01"

def run_cmd(ssh, cmd, title):
    print(f"\n{'='*50}\n>>> {title}\n{cmd}\n{'='*50}")
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
    print(f"Connecting to {SERVER_IP} to install a fresh GitHub Runner...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        
        # 1. Create a NEW directory for this specific blog runner
        cmd_dir = "mkdir -p /home/ubuntu-server/blog-runner && cd /home/ubuntu-server/blog-runner"
        run_cmd(ssh, cmd_dir, "Creating new runner directory")
        
        # 2. Extract runner (assuming the tar file is already downloaded in the other folder)
        cmd_extract = (
            "cd /home/ubuntu-server/blog-runner && "
            "cp /home/ubuntu-server/actions-runner/actions-runner-linux-x64-2.337.0.tar.gz . && "
            "tar xzf ./actions-runner-linux-x64-2.337.0.tar.gz"
        )
        run_cmd(ssh, cmd_extract, "Extracting Runner")
        
        # 3. Configure it
        cmd_config = (
            "cd /home/ubuntu-server/blog-runner && "
            "./config.sh --url https://github.com/hashira779/CamTech.Blog "
            "--token BSGAGAQRCYTNFZXDCISXWW3KYD4YU --unattended --name CamTech-Blog-Runner"
        )
        run_cmd(ssh, cmd_config, "Configuring GitHub Runner for CamTech.Blog")
        
        # 4. Install and start service
        cmd_service = (
            "cd /home/ubuntu-server/blog-runner && "
            "echo '{PASSWORD}' | sudo -S ./svc.sh install && "
            "echo '{PASSWORD}' | sudo -S ./svc.sh start"
        )
        run_cmd(ssh, cmd_service, "Installing and Starting Service")
        
        ssh.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()

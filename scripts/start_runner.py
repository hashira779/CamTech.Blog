import paramiko

SERVER_IP = "10.1.0.11"
USERNAME = "ubuntu-server"
PASSWORD = "pTT!CT01"

def run_cmd(ssh, cmd, title):
    print(f"\n{'='*50}\n>>> {title}\n{cmd}\n{'='*50}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=120)
    for line in stdout:
        print(line, end="")
    
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0:
        print(f"❌ Command failed with exit status {exit_status}")
    else:
        print("✅ Success")

def main():
    print(f"Connecting to {SERVER_IP} to start GitHub Actions Runner...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        
        # We know it's already configured, so just install and start the service
        cmd_install = f"cd /home/ubuntu-server/actions-runner && echo '{PASSWORD}' | sudo -S ./svc.sh install"
        run_cmd(ssh, cmd_install, "Installing Service")
        
        cmd_start = f"cd /home/ubuntu-server/actions-runner && echo '{PASSWORD}' | sudo -S ./svc.sh start"
        run_cmd(ssh, cmd_start, "Starting Service")
        
        cmd_status = f"cd /home/ubuntu-server/actions-runner && echo '{PASSWORD}' | sudo -S ./svc.sh status"
        run_cmd(ssh, cmd_status, "Checking Status")
        
        ssh.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()

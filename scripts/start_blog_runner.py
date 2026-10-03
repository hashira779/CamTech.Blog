import paramiko

SERVER_IP = "10.1.0.11"
USERNAME = "ubuntu-server"
PASSWORD = "pTT!CT01"

def run_cmd(ssh, cmd, title):
    print(f"\n{'='*50}\n>>> {title}\n{cmd}\n{'='*50}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=60)
    for line in stdout:
        print(line, end="")

def main():
    print(f"Connecting to {SERVER_IP} to start the new blog runner...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
    
    cmd_install = f"cd /home/ubuntu-server/blog-runner && echo '{PASSWORD}' | sudo -S ./svc.sh install"
    run_cmd(ssh, cmd_install, "Installing Service")
    
    cmd_start = f"cd /home/ubuntu-server/blog-runner && echo '{PASSWORD}' | sudo -S ./svc.sh start"
    run_cmd(ssh, cmd_start, "Starting Service")
    
    ssh.close()

if __name__ == "__main__":
    main()

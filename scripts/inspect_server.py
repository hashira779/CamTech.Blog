import paramiko

def inspect_server():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting to 10.1.0.11 as ubuntu-server...")
    ssh.connect("10.1.0.11", username="ubuntu-server", password="pTT!CT01", timeout=10)
    
    commands = [
        ("Current Directory & User", "pwd; whoami"),
        ("Check GitHub Connectivity", "curl -sI https://github.com | head -n 1"),
        ("Listening TCP Ports", "ss -tlpn | grep LISTEN"),
        ("Free Memory & Disk", "free -h; df -h /"),
    ]
    
    for title, cmd in commands:
        print(f"\n--- {title} ---")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        if out:
            print(out)
        if err:
            print(f"STDERR: {err}")
            
    ssh.close()
    print("\nDone inspecting.")

if __name__ == "__main__":
    inspect_server()

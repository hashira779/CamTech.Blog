# Distributed Denial of Service (DDoS) Mitigation

## 1. Edge-First Strategy
Large volumetric DDoS attacks (UDP floods, SYN floods, HTTP Layer 7 floods) cannot and should not be absorbed at the application server origin.

The platform relies on:
1. **Cloudflare Edge Protection**: Automatic mitigation of SYN, ACK, and UDP reflection attacks before reaching origin IPs.
2. **Origin Shielding**: Application origins only accept traffic from Cloudflare edge IP subnets; direct Internet connections to backend ports are dropped by firewall rules.
3. **NGINX Rate Limiting & Microcaching**: If a traffic surge reaches the load balancer, NGINX microcaching (10s TTL) serves cached HTML without passing requests to application processes.
4. **Under-Attack Mode Procedure**: In extreme incidents, Cloudflare Under-Attack mode is manually engaged via security ops to issue JavaScript challenges to unverified visitors.

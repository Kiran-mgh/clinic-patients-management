# AWS Deployment Architecture - Amar Hospital

This document describes the recommended, highly available, secure, and production-ready AWS deployment architecture for the **Amar Hospital Healthcare Management Platform**.

---

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Route53 ["DNS & Edge Routing"]
        R53[Route 53] --> CF[CloudFront CDN]
        R53 --> ALB[Application Load Balancer]
    end

    subgraph VPC ["AWS Virtual Private Cloud (VPC)"]
        subgraph PublicSubnets ["Public Subnets (Multi-AZ)"]
            ALB
            NAT[NAT Gateway]
        end

        subgraph PrivateSubnetsApp ["Private Subnets - App Layer (Multi-AZ)"]
            ECS[ECS Fargate Service - NestJS Backend]
        end

        subgraph PrivateSubnetsDB ["Private Subnets - Data Layer (Multi-AZ)"]
            RDS[(Amazon RDS - PostgreSQL Master/Replica)]
        end
    end

    subgraph FrontendHosting ["Static Hosting"]
        CF --> S3[Amazon S3 Bucket - React Admin Portal]
    end

    subgraph ExternalIntegrations ["Third-Party & Push Services"]
        FCM[Firebase Cloud Messaging]
        SMS[SMS Gateway / Twilio]
    end

    ALB -->|Forward HTTPS Requests| ECS
    ECS -->|SQL Queries| RDS
    ECS -.->|Sends Notifications| FCM
    ECS -.->|Sends Verification OTP| SMS
    
    NAT -->|Outbound traffic (FCM, SMS)| Internet((Internet))
    ECS --> NAT
```

---

## Architectural Components

### 1. DNS & Frontend Static Hosting
* **Amazon Route 53:** Resolves the clinic domains (e.g., `admin.amarhospital.com` and `api.amarhospital.com`).
* **Amazon S3:** Hosts the compiled production assets of the React Doctor/Admin Web Portal.
* **Amazon CloudFront:** Serves as the Content Delivery Network (CDN) in front of S3, caching assets at edge locations, and handling SSL termination (using AWS Certificate Manager certificates).

### 2. Network Layout (VPC)
* **VPC:** A dedicated virtual private network spanning two Availability Zones (AZs) for high availability.
* **Public Subnets:** Contains Route tables, Internet Gateway, and an Application Load Balancer (ALB).
* **Private App Subnets:** Houses the NestJS API application containers, blocking direct internet access. Outbound communication uses a NAT Gateway.
* **Private DB Subnets:** Secure isolated subnets for the PostgreSQL database, accessible only by the App subnet security groups.

### 3. Compute Layer (AWS ECS Fargate)
* **Amazon ECS (Elastic Container Service):** Run NestJS as a serverless container service using **AWS Fargate** to avoid server maintenance.
* **Auto Scaling:** Scales container count based on CPU and memory usage, ensuring responsiveness during peak morning token times (6:00 AM - 9:00 AM).
* **Application Load Balancer (ALB):** Terminates SSL for API requests and balances traffic across ECS task instances.

### 4. Database Layer (Amazon RDS PostgreSQL)
* **Amazon RDS for PostgreSQL:** Managed database instance configured in a Multi-AZ deployment.
* **Automatic Failover:** A standby replica is automatically maintained in the secondary AZ to handle master instance failure without data loss.
* **Storage Auto-scaling:** Automatically increases storage as the clinic records and audit logs grow.

### 5. Third-Party Integrations
* **Firebase Cloud Messaging (FCM):** The backend interacts with FCM APIs to deliver token state and queue updates to iOS and Android patient devices.
* **SMS Gateway:** External SMS API (e.g., Twilio) integrated into NestJS to dispatch passwordless verification OTPs to patients logging in.

---

## Security & Compliance
* **Encryption at Rest:** Standard AWS KMS keys encrypting RDS disks, S3 buckets, and ECS environment variables.
* **Encryption in Transit:** HTTPS enforced across all endpoints. CloudFront and ALB terminate SSL using ACM certificates with TLS 1.3.
* **IAM Roles:** Strict Least-Privilege IAM execution roles assigned to ECS tasks to read/write only their specific S3 resources or Parameter Store secrets.
* **Security Groups:** 
  - Web SGs permit traffic only from CloudFront.
  - ALB permits 443 from anywhere.
  - ECS permits traffic only from the ALB.
  - RDS permits traffic only from ECS on port 5432.

---
title: "AWS 서버 구축은 어떻게 해야할까"
description: "하나의 큰 네트워크(VPC, 회사 네트워크)를 작은 네트워크 단위로 나눈 것 Public Subnet: 라우팅 테이블에 Internet Gateway(IGW)로 가는 라우트가 있는 서브넷 Private Subnet: Internet Gateway로 가는 라우트가 없는 서브넷"
image: "/images/blog/tistory-60/image-01.png"
pubDate: 2025-11-13
category: "infra"
tags: ["aws"]
draft: false
slug: "tistory-60"
---
## 사전 지식

### VPC - 가상의 네트워크 공간

### 서브넷

하나의 큰 네트워크(VPC, 회사 네트워크)를 작은 네트워크 단위로 나눈 것

**Public Subnet**: 라우팅 테이블에 **Internet Gateway(IGW)로 가는 라우트**가 있는 서브넷

**Private Subnet**: Internet Gateway로 가는 라우트가 **없는** 서브넷

## Private Subnet

외부에서 직접 접근할 수 없는 Subnet

aws 기준으로는 subnet를 기본 세팅으로 생성하면 Private Subnet이고 추가로 서브넷에 인터넷 게이트웨이(IGW)와 라우팅 테이블을 설정해주면 Public Subnet으로 사용할 수 있게 된다.

## NAT Gateway

프라이빗 서브넷에서도 인터넷을 사용해야 하는 경우가 있다.(대표적으로 버전 업데이트) 이런 경우에는 퍼블릭 서브넷처럼 인터넷 게이트웨이를 사용하면 안되는데(외부에서 Private에 직접 접근할 수 있게 된다.) 이때 NAT 게이트웨이를 사용하게 된다.

NAT 게이트웨이는 서브넷 안에서 외부 인터넷으로 일방통행만 가능하다. 그로 인해 외부 인터넷에 요청은 보낼 수 있으면서 외부 인터넷으로부터의 접근을 막을 수 있게 된다.

![AWS 서버 구축은 어떻게 해야할까](/images/blog/tistory-60/image-01.png)

### **NAT 게이트웨이는 Public Subnet에 위치한다.**

![AWS 서버 구축은 어떻게 해야할까](/images/blog/tistory-60/image-02.png)

### NAT 게이트웨이의 단점: 비싸다

![AWS 서버 구축은 어떻게 해야할까](/images/blog/tistory-60/image-03.png)

한국 돈으로 환산 (환율 1,300원 기준)

### NAT Gateway 시간당 요금

USD 0.059/시간 × 1,300원 = 약 77원/시간

### 월 단위

77원 × 24시간 × 30일 = 약 55,440원/월 (730시간 기준: 약 56,210원)

### 데이터 처리 요금

USD 0.059/GB × 1,300원 = 약 77원/GB

## 실제 예상 비용

**Private Subnet에서 NAT Gateway 사용 시:**

\`고정 비용: 약 55,000원/월 (게이트웨이 유지 비용) 변동 비용: 사용량 × 77원/GB

예시:

-   100GB 처리: 7,700원
-   500GB 처리: 38,500원
-   1TB 처리: 77,000원

총 월 비용 = 55,000원 + (데이터 처리량 × 77원)\`

**그래서 타협안으로 NAT Instance를 사용하는 방법도 있다.**

[https://inpa.tistory.com/entry/AWS-](https://inpa.tistory.com/entry/AWS-)[📚-NAT-Gateway-NAT-Instance-대체해서-비용-절약](https://inpa.tistory.com/entry/AWS-%F0%9F%93%9A-NAT-Gateway-NAT-Instance-%EB%8C%80%EC%B2%B4%ED%95%B4%EC%84%9C-%EB%B9%84%EC%9A%A9-%EC%A0%88%EC%95%BD)

 [\[AWS\] 📚 NAT Gateway → NAT Instance 대체해서 비용 절약하기

NAT 인프라 AWS에서 네트워크를 설계할때 NAT의 사용은 필수적이다. 보안상 서버들을 외부에서 접근할 수 없고 확인할 수 없도록 해야하기 때문이다. 그래서 VPC 인프라를 구축할때 Public 서브넷과 P

inpa.tistory.com](https://inpa.tistory.com/entry/AWS-%F0%9F%93%9A-NAT-Gateway-NAT-Instance-%EB%8C%80%EC%B2%B4%ED%95%B4%EC%84%9C-%EB%B9%84%EC%9A%A9-%EC%A0%88%EC%95%BD)

[https://jjung0326.tistory.com/84](https://jjung0326.tistory.com/84)

 [\[AWS\] 3-Tier-Architecture 구축 #3 - NAT Gateway 대신 NAT Instance를 사용해 비용 절약하기

아래 포스팅에서 이어지는 글입니다. \[AWS\] 3-Tier-Architecture 구축 #2 - VPC 아래 포스팅에서 이어지는 글입니다. \[AWS\] 3-Tier-Architecture 구축 #1 - 설계 Django로 만든 프로젝트를 AWS에서 3 Tier Architecture로 구

jjung0326.tistory.com](https://jjung0326.tistory.com/84)

## Bastion Host

외부 인터넷에서 내부 네트워크로 접근할 때 가장 먼저 거치게 되는 컴퓨터

![AWS 서버 구축은 어떻게 해야할까](/images/blog/tistory-60/image-04.png)

![AWS 서버 구축은 어떻게 해야할까](/images/blog/tistory-60/image-05.png)

### **쉬운 그림**

![AWS 서버 구축은 어떻게 해야할까](/images/blog/tistory-60/image-06.png)

### **아 Bastion은 아파트 1층 현관이구나!**

### Bastion = 아파트 1층 현관

보안 그룹:

-   입주민(개발자 IP)만 출입 가능
-   외부인은 못 들어옴

ssh -i bastion-key.pem ec2-user@bastion → 입주민 카드키(bastion-key.pem)로 입장

### WAS = 내 집 현관

보안 그룹:

1.  1층 현관 통과한 사람(Bastion)만 SSH 가능

### RDS = 금고

보안 그룹:

-   오직 집주인(WAS)만 열 수 있음

### **Bastion Host vs VPN**

Bastion Host와 VPN은 자주 헷갈린다. 둘 다 외부에서 내부로 들어가는 통로처럼 보이기 때문이다. 하지만 접근 방식이 다르다. **VPN(Virtual Private Network)** 은 사용자 기기와 내부 네트워크 전체를 잇는 **암호화된 터널**을 만들어준다. 즉, 한 번 VPN에 접속하면 내부망의 모든 리소스에 접근할 수 있다. 반면 \*\*Bastion Host\*\*는 특정 서버나 서비스로의 **접속을 중계하고 감시**하는 역할을 한다.

즉, VPN이 ‘내부망 전체로 들어오는 길’이라면, Bastion Host는 ‘내부 서버 앞에 서 있는 문지기’에 가깝다.

[https://harris91.vercel.app/bastion-host](https://harris91.vercel.app/bastion-host)

 [Bastion Host(배스천 호스트) 란?

클라우드에 보안을 위한 내/외부 게이트 호스트

harris91.vercel.app](https://harris91.vercel.app/bastion-host)

### 프로덕션(실제 운영 환경)으로 간다면

아래처럼 해야한다.

![AWS 서버 구축은 어떻게 해야할까](/images/blog/tistory-60/image-07.png)

### 해커톤같이 실제 운영 레벨 보안을 고려하지 않는 상황이라면

### (급하면 S3도 안하고 그대로 올려도 될듯)

![AWS 서버 구축은 어떻게 해야할까](/images/blog/tistory-60/image-08.png)

#### **그런데 Bastion Host Server를 꼭 둬야 할까?**

![AWS 서버 구축은 어떻게 해야할까](/images/blog/tistory-60/image-09.png)

[https://musma.github.io/2019/11/29/about-aws-ssm.html](https://musma.github.io/2019/11/29/about-aws-ssm.html)

 [AWS SSM으로 EC2 인스턴스에 접근하기 (SSH 대체)

목차 서론 들어가기: 더 좋은 방법 대상 독자 SSM: AWS Systems Manager 원격 호스트 접속 방법 비교: SSH (기존) vs. SSM (개선) S...

musma.github.io](https://musma.github.io/2019/11/29/about-aws-ssm.html)

## SSM

그래서 SSM을 사용해 접근하는 방식이 많이 쓰인다고 한다.

이 방식은 IAM 정책을 활용해 권한을 부여하고 AWS Console, AWS CLI를 사용해서 인스턴스에 접근하는데 아래와 같은 장점이 있다.

1.  Bastion Host가 필요없다.
2.  Key Pair가 필요없다.
3.  Security Group + Rule이 필요 없다.
4.  그럼에도 불구하고, **SSH로 할 수 있는 건 다 할 수 있다.**
5.  **Private Subnet에 있는 EC2 인스턴스에 바로 접속**할 수 있다. (마치 VPN에 있는 것처럼)
6.  AWS Client VPN을 사용하는 것에 비해서 비용이 적게 든다. (돈 + 수고로움)

[https://jibinary.tistory.com/371#google\_vignette](https://jibinary.tistory.com/371#google_vignette)

 [\[AWS\] Systems Manager란? 쉽게 개념 정리 (Patch Manager, Session Manager, Parameter Store, Run Command, Automation)

◇  공부 기록용으로 작성하였으니 틀린점, 피드백 주시면 감사하겠습니다 ◇ Systems Manager (SSM)Systems Manager은 여러 AWS 리소스를 그룹화하여 운영 및 유지보수를 자동화하고 효율적으로 관리하

jibinary.tistory.com](https://jibinary.tistory.com/371#google_vignette)

### SSM 아키텍처

![AWS 서버 구축은 어떻게 해야할까](/images/blog/tistory-60/image-10.png)

### SSM은 IP가 아니라 인스턴스 ID로 접근한다고 하는데

**접근 방식 차이**

### SSH (IP 기반)

```
ssh ec2-user@3.35.123.45      *# Public IP*
ssh ec2-user@10.0.2.10        *# Private IP*
*# IP 주소가 바뀌면* 다시 찾아야 함
```

### SSM (Instance ID 기반)

```
aws ssm start-session --target i-1234567890abcdef0
*# IP가 바뀌어도* Instance ID는 안 바뀐다
```

공식문서도 있다.(레전드 AWS)

[https://docs.aws.amazon.com/ko\_kr/prescriptive-guidance/latest/patterns/access-a-bastion-host-by-using-session-manager-and-amazon-ec2-instance-connect.html](https://docs.aws.amazon.com/ko_kr/prescriptive-guidance/latest/patterns/access-a-bastion-host-by-using-session-manager-and-amazon-ec2-instance-connect.html)

 [Session Manager 및 Amazon EC2 인스턴스 연결을 사용한 Bastion Host 액세스 - 권장 가이드

이 페이지에 작업이 필요하다는 점을 알려 주셔서 감사합니다. 실망시켜 드려 죄송합니다. 잠깐 시간을 내어 설명서를 향상시킬 수 있는 방법에 대해 말씀해 주십시오.

docs.aws.amazon.com](https://docs.aws.amazon.com/ko_kr/prescriptive-guidance/latest/patterns/access-a-bastion-host-by-using-session-manager-and-amazon-ec2-instance-connect.html)

고해성사를 하자면 나는 지금까지 aws 서버 구축을 완전 야매로 해왔다. (Claude + 블로그..)

이번에 aws 스터디를 하게 되면서 근본이 없던 내가 근본을 찾아나가고 있는데 몰랐던 내용이 엄청 많아서 반성을 하게 된다.

나 이제 aws에서 a까지는 알 것 같다. 다음은 w를 배우고 돌아오겠다.

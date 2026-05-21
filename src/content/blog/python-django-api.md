---
title: "python django 프로젝트에서 네이버 로그인 api 활용해 보기"
description: "이번엔 프로젝트를 진행하면서 만들게 됐던 python django에서 네이버 로그인 기능 구현하는 법을 알아보자 네이버 로그인을 구현한다는 건 시작 전에는 어려워보이지만 막상 해보면 네이버 개발자들이 만들 서비스에 숟가락만 얹는 것임을 알 수 있다. 먼저 Naver"
image: "/images/blog/python-django-api/image-01.png"
pubDate: 2025-01-23
category: "backend"
tags: ["python"]
draft: false
slug: "python-django-api"
---
이번엔 프로젝트를 진행하면서 만들게 됐던 python django에서 네이버 로그인 기능 구현하는 법을 알아보자

## **시작**

네이버 로그인을 구현한다는 건 시작 전에는 어려워보이지만 막상 해보면 네이버 개발자들이 만들 서비스에 숟가락만 얹는 것임을 알 수 있다.

먼저 Naver Developers에서 api를 받아올 app을 생성해야 한다.

[https://developers.naver.com/main/](https://developers.naver.com/main/)

 [NAVER Developers

네이버 오픈 API들을 활용해 개발자들이 다양한 애플리케이션을 개발할 수 있도록 API 가이드와 SDK를 제공합니다. 제공중인 오픈 API에는 네이버 로그인, 검색, 단축URL, 캡차를 비롯 기계번역, 음

developers.naver.com](https://developers.naver.com/main/)

![python django 프로젝트에서 네이버 로그인 api 활용해 보기](/images/blog/python-django-api/image-01.png)

**app 등록 클릭**

![python django 프로젝트에서 네이버 로그인 api 활용해 보기](/images/blog/python-django-api/image-02.png)

앱 등록에 들어가면 먼저 이름과 사용할 api를 선택해야 한다. 네이버 로그인을 선택하면 아래에서 정보 요청시 받아올 내용들을 선택할 수 있다.

여기서 동의를 하지 않으면 로그인을 못하는 내용은 필수, 선택적으로 동의받을 수 있는 내용은 추가로 선택하면 된다.

![python django 프로젝트에서 네이버 로그인 api 활용해 보기](/images/blog/python-django-api/image-03.png)

다음은 서비스를 사용할 url을 지정해야 한다.

서비스 url은 로그인 창을 표시할 url

Callback URL은 로그인 이후 이동할 페이지의 URL이다.

![python django 프로젝트에서 네이버 로그인 api 활용해 보기](/images/blog/python-django-api/image-04.png)

이제 ID와 key 값을 기억해둔다.

```
    path('naver/login/', views.naver_login, name='naver_login'),
    path('naver/callback/', views.naver_callback, name='naver_callback'),
```

이제 django로 돌아가서 나는 url을 이렇게 설정하였다.

경로를 보면 알 수 있듯 위의 서비스 url과 callback url에 동일하게 맞춰야 한다.

```
import requests
from django.shortcuts import redirect
from django.conf import settings

NAVER_CLIENT_ID = 'your_client_id' # 본인 API 아이디
NAVER_CLIENT_SECRET = 'your_client_secret' # 본인 API 키
NAVER_REDIRECT_URI = 'http://localhost:8000/naver/callback' # 본인 Callback url

# 네이버 로그인
def naver_login(request):
	# 네이버 로그인 url 생성
    naver_auth_url = (
        "https://nid.naver.com/oauth2.0/authorize?"
        f"client_id={settings.NAVER_CLIENT_ID}&"
        f"redirect_uri={settings.NAVER_REDIRECT_URI}&"
        "response_type=code"
    )

    # naver_callback으로 전송
    return redirect(naver_auth_url)

def naver_callback(request):
    # 인증 코드 추출
    code = request.GET.get('code')
    state = request.GET.get('state')

    # 인증 코드 없으면 에러 응답
    if not code:
        return JsonResponse({'error': '인증 코드가 없습니다.'}, status=400)

    # 네이버 토큰 요청 URL 설정
    token_url = "https://nid.naver.com/oauth2.0/token"

    # 토큰 요청에 필요한 데이터 구성
    token_data = {
        'grant_type': 'authorization_code',
        'client_id': settings.NAVER_CLIENT_ID,
        'client_secret': settings.NAVER_CLIENT_SECRET,
        'redirect_uri': settings.NAVER_REDIRECT_URI,
        'code': code,
    }

    # 토큰 요청 및 응답 처리
    token_response = requests.post(token_url, data=token_data)
    token_json = token_response.json()

    # 액세스 토큰 추출
    access_token = token_json.get('access_token')
    if not access_token:
        return JsonResponse({'error': 'Access Token 요청 실패'}, status=400)

    # 사용자 정보 요청 URL
    user_info_url = "https://openapi.naver.com/v1/nid/me"

    # 액세스 토큰으로 헤더 생성
    headers = {'Authorization': f'Bearer {access_token}'}

    # 사용자 정보 요청
    user_info_response = requests.get(user_info_url, headers=headers)
    user_info_json = user_info_response.json()

    # 네이버 사용자 ID, 이름 추출
    naver_id = user_info_json.get('response', {}).get('id')
    naver_name = user_info_json.get('response', {}).get('name')

    # 고유 닉네임 생성
    unique_nickname = generate_unique_nickname(naver_name)

    # 사용자 정보 추출 실패 시 처리
    if not naver_id:
        messages.error(request, "네이버 사용자 정보를 가져오는 데 실패했습니다.")
        return redirect('users:main_prelogin')

    # 사용자 정보 저장 또는 업데이트
    user, created = User.objects.update_or_create(
        id=f"n{naver_id}",
        defaults={
            'nickname': unique_nickname,
            'login_type': 'naver',
        },
    )

    # 세션에 사용자 정보 저장
    request.session['user_id'] = user.id
    request.session['naver_access_token'] = access_token

    # 사용자 로그인 처리
    login(request, user)

    # 메인 페이지로 리다이렉트
    return redirect('users:main_page')
```

이 100줄도 안되는 코드로 로그인 완성이다.

고유 닉네임 생성 부분은 개발 목표 특성상 닉네임 중복이 안돼서 중복되는 닉네임 뒤에 숫자를 넣는 과정을 추가했다. 생략해도 된다.

이제 로그인을 했으면 로그아웃도 해야 하는데 네이버 로그인 api는 로그아웃 기능을 지원 안하기에 로그아웃 하고싶어요 한다고 내보내주지 않는다. 직접 세션과 토큰을 초기화 해줘야 한다.

```
네이버 승인 토큰이 존재하면 네이버 로그아웃 메서드 호출 후 메인페이지로 이동
def logout_view(request):
    if 'naver_access_token' in request.session:
        naver_logout(request)  # 네이버 토큰 삭제
        return redirect('users:main_prelogin')

def naver_logout(request):

    # 클라이언트 ID, 시크릿 키, 액세스 토큰을 포함한 네이버 토큰 삭제 요청 데이터 구성
    revoke_data = {
        'grant_type': 'delete',
        'client_id': settings.NAVER_CLIENT_ID,
        'client_secret': settings.NAVER_CLIENT_SECRET,
        'access_token': access_token,
        'service_provider': 'NAVER',
    }

    # 네이버 서버에 토큰 삭제 요청
	# 응답 JSON 파싱
    response = requests.post(revoke_url, data=revoke_data)
    response_json = response.json()

	# 토큰 삭제 성공 시
    # 세션에서 네이버 토큰 제거
    # Django 세션 전체 초기화
    if response_json.get('result') == 'success':
        del request.session['naver_access_token']
        request.session.flush()  # Django 세션 초기화
        messages.success(request, "네이버에서 로그아웃되었습니다.")
```

이것까지 하면 로그인 기능 구현 끝!

코드를 읽어보면 생각보다 복잡하지 않은 걸 알 수 있다. 

구글 로그인과 카카오 로그인도 구현했었는데 절차가 비슷하다 오히려 내 체감으로는 네이버가 제일 복잡했으니 꼭 다른 로그인 구현도 시도해보도록 하자.

# Learning Index

이 문서는 이 프로젝트에서 현재 무엇이 개발되었고, 무엇이 아직 예정 상태인지 빠르게 확인하기 위한 교재 인덱스입니다.

## Index Rule

각 항목은 아래 기준으로 관리합니다.

- `Number`: 교재 인덱스 번호
- `List Type Name`: 학습 항목 이름 또는 패턴 이름
- `Content`: 이 페이지에서 다루는 핵심 내용
- `Menu Location`: 실제 프로그램에서 들어가는 메뉴 경로
- `Status`: `ready` 또는 `planned`

## React Track

### Common

| Number | List Type Name | Content | Menu Location | Status |
| --- | --- | --- | --- | --- |
| rc001 | App Mount & Auth Check | 앱 시작 시 auth check, 세션 복원, AUTH_RESTORE fallback 흐름을 학습한다. | Home > React Runtime Flow > 공통 > 앱 초기화와 세션 복원 | ready |
| rc002 | Data Fetch List | 목록 조회 request, loading, success, failure, reducer 반영 흐름을 학습한다. | Home > React Runtime Flow > 공통 > 공통 목록 조회 | ready |
| rc003 | Create/Delete Mutation | 생성/삭제 mutation과 상태 갱신 흐름을 학습한다. | Home > React Runtime Flow > 공통 > 공통 생성/삭제 처리 | ready |
| rc004 | Session Strategy Type 1 | 서버 세션 확인 중심 인증 복원 패턴을 정리할 예정이다. | Home > React Runtime Flow > 공통 > 세션 처리 > Type 1 | planned |
| rc005 | Session Strategy Type 2 | access token / refresh token 기반 인증 복원 패턴을 정리할 예정이다. | Home > React Runtime Flow > 공통 > 세션 처리 > Type 2 | planned |
| rc006 | Session Strategy Type 3 | route guard 중심 인증 접근 제어 패턴을 정리할 예정이다. | Home > React Runtime Flow > 공통 > 세션 처리 > Type 3 | planned |
| rc007 | Session Strategy Type 4 | hybrid restore 전략과 UX/보안 trade-off를 정리할 예정이다. | Home > React Runtime Flow > 공통 > 세션 처리 > Type 4 | planned |

### Login Page

| Number | List Type Name | Content | Menu Location | Status |
| --- | --- | --- | --- | --- |
| rl001 | Login Flow | 입력값 수집, payload 생성, 로그인 API, LOGIN_SUCCESS/LOGOUT 흐름을 학습한다. | Home > React Runtime Flow > 로그인 페이지 > 로그인 요청과 인증 상태 반영 | ready |

### Sign Up

| Number | List Type Name | Content | Menu Location | Status |
| --- | --- | --- | --- | --- |
| rs001 | Sign Up Basic Flow | 회원가입 입력 검증, 요청 생성, 성공/실패 처리 흐름을 만들 예정이다. | Home > React Runtime Flow > 회원가입 > 회원가입 기본 흐름 | planned |

## How To Use This Index

이 문서는 아래 목적에 사용합니다.

1. 지금 어떤 교재 페이지가 이미 개발되었는지 빠르게 확인한다.
2. 새 페이지를 만들 때 번호와 메뉴 위치를 먼저 고정한다.
3. 기능 개발보다 학습 구조가 어디까지 완성되었는지 추적한다.
4. 사람과 AI 모두 같은 기준으로 현재 진행 상태를 해석하게 만든다.

## Update Rule

새 항목을 추가할 때는 다음 순서를 권장합니다.

1. 이 문서에 번호를 먼저 만든다.
2. 메뉴 위치를 먼저 정한다.
3. `planned` 상태로 등록한다.
4. 실제 페이지를 만들면 `ready`로 바꾼다.

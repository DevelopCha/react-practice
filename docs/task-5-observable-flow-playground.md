# Task 5. Observable Flow Playground 방향 리팩토링 요청서

> 현재 MVP는 React runtime 흐름을 관찰할 수 있는 기본 기능은 갖추고 있다.
> 하지만 아직 "로그를 보여주는 학습 도구" 수준에 머물러 있다.
>
> 이번 작업부터는 프로젝트 방향을 다음 철학으로 재정렬한다.
>
> "실행 가능한 코드 이해 Playground"
>
> 즉 단순 trace viewer가 아니라, 사용자가 직접 값을 조작하고 흐름을 실험하며
> 상태 변화와 업무 의미를 체감할 수 있는 구조로 발전시킨다.

---

## 핵심 방향 변화

### 기존 방향

- 로그 출력 중심
- 이벤트 추적 중심
- dispatch/reducer 관찰 중심

### 변경 방향

사용자가 다음 흐름을 직접 경험하도록 만든다.

1. 값을 수정한다.
2. 실행한다.
3. 흐름을 따라간다.
4. 상태를 비교한다.
5. 왜 이런 결과가 발생했는지 이해한다.

즉 목표는 "실행 가능한 살아있는 문서"이다.

---

## 이번 작업의 핵심 목표

현재 프로젝트를 단순 Runtime Monitor에서 Observable Flow Playground 방향으로
리팩토링한다.

사용자는 단순히 로그인이 성공했다는 결과만 보는 것이 아니라, 입력값이 payload로
변환되고 API를 거쳐 reducer dispatch가 발생하며, 그 결과 state가 변경되어 화면이
다시 렌더되는 과정을 하나의 실행 흐름으로 체감해야 한다.

---

## 1. Trace Session 개념 강화

현재 trace는 로그 리스트에 가깝다.

이번 작업부터는 다음 개념을 명확히 한다.

> 버튼 1회 실행 = 하나의 실험 Session

예시:

- Auth Check Session
- Login Session
- Create Post Session

각 Session은 다음 정보를 하나의 서사처럼 보여줘야 한다.

- 입력값
- API 흐름
- 상태 변화
- 최종 결과

---

## 2. Input Lab 개념 추가

좌측 Action Panel은 단순 버튼 영역이 아니라 사용자가 직접 실험하는 Playground로
변경한다.

예시:

```json
{
  "id": "admin",
  "password": "1234"
}
```

사용자는 다음 항목을 직접 수정할 수 있어야 한다.

- 입력값
- payload
- mock 조건

핵심 질문은 이것이다.

> 값을 바꾸면 흐름이 어떻게 달라지는가?

---

## 3. Timeline 중심 구조로 재배치

현재 Flow Monitor는 로그 리스트 느낌이 강하다.

이번 작업에서는 실행 흐름 Timeline처럼 동작해야 한다.

예시:

```text
[done] 입력값 수집
[done] payload 생성
[done] API 요청
[pending] 응답 normalize
[pending] reducer dispatch
[pending] rerender
```

각 단계는 다음 정보를 가질 수 있다.

- 현재 상태
- 설명 카드
- 관련 데이터
- 코드 위치

---

## 4. Checkpoint System 도입

각 실행 단계에서 상태 스냅샷을 저장한다.

예시:

```ts
observe("payload_build", {
  formState,
  requestPayload,
});
```

목적:

- 이전 상태와 비교
- 특정 단계 inspect
- 데이터 변화 이해

---

## 5. State Inspector 리팩토링

기존 raw JSON dump는 보조 정보로 격하한다.

메인 기능은 다음 질문에 답해야 한다.

> 무엇이 왜 바뀌었는가?

예시:

```text
Before:
isLogin = false

After:
isLogin = true

Reason:
AUTH_RESTORE dispatch completed.
```

---

## 6. Meaning Panel 추가

단순 로그와 상태만 보여주면 안 된다.

각 단계에 대해 다음 내용을 설명하는 학습 패널을 추가한다.

- 왜 필요한 단계인지
- 어떤 목적의 데이터인지
- 왜 상태가 변경되는지

예시:

```text
현재 단계 설명:
입력된 폼 데이터를 서버 요청용 payload로 변환합니다.

주의:
status='Y' 인 경우 activeOnly=true 로 normalize 됩니다.
```

---

## 7. API Monitor 역할 재정의

API Monitor는 단순 request/response 표시 영역이 아니다.

목표는 다음과 같다.

> 데이터가 어떤 의미로 변형되는지 보여준다.

표시 항목:

- request payload
- normalized payload
- response raw data
- transformed response
- reducer payload

즉 API를 데이터 흐름 관점으로 보여준다.

---

## 8. Function Call Viewer 개선

현재 Function Call Viewer는 단순 함수 나열 느낌이 강하다.

이번 작업에서는 함수명 자체보다 업무 흐름 레이어를 우선한다.

예시:

```text
사용자 입력
-> payload 생성
-> 서버 요청
-> 응답 정규화
-> Context 상태 반영
-> 화면 갱신
```

---

## 9. Console 역할 축소

Raw console은 유지할 수 있지만 메인 정보가 되어서는 안 된다.

Console은 보조 debug drawer 정도로 유지하고, 사용자가 주로 보아야 하는 것은 다음
영역이다.

- Timeline
- Meaning Panel
- State Change
- API Data Flow

---

## 10. Playground 철학 유지

이 프로젝트는 단순 CRUD 샘플 사이트가 아니다.

사용자는 다음 활동을 할 수 있어야 한다.

- 값을 바꾼다.
- 흐름을 실행한다.
- 결과를 비교한다.
- 내부 의미를 이해한다.

즉 프로젝트의 핵심 가치는 다음 문장이다.

> 코드를 실험 가능한 상태로 만드는 것

---

## 중요 구현 원칙

1. 로그 나열 금지
2. 상태 dump 중심 금지
3. 의미 없는 함수명 추적 금지
4. 사용자 행동 기반 흐름 유지
5. 상태 변화 이유 설명 강화
6. Playground 형태 유지
7. 학습자가 직접 조작 가능해야 함

---

## 구현 우선순위 제안

1. Trace Session 모델을 먼저 정리한다.
2. Input Lab에서 실행 payload를 직접 수정할 수 있게 한다.
3. Timeline UI를 Session 중심으로 재배치한다.
4. Checkpoint와 State Diff를 연결한다.
5. Meaning Panel과 API Data Flow를 각 단계에 연결한다.
6. Raw Console을 보조 drawer로 낮춘다.

이 순서로 진행하면 기존 Runtime Monitor 기능을 버리지 않으면서도 프로젝트의 중심을
"로그 관찰"에서 "실행 기반 이해"로 옮길 수 있다.

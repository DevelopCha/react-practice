export type LearningFeature = {
  id: string;
  title: string;
  description: string;
  to?: string;
  status?: 'ready' | 'planned';
};

export type LearningGroup = {
  id: string;
  title: string;
  summary: string;
  intent: string;
  features: LearningFeature[];
};

export type LearningTrack = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  spec: string[];
  groups: LearningGroup[];
};

export const reactTrack: LearningTrack = {
  id: 'react',
  title: 'React Runtime Flow',
  tagline: 'Context, reducer, API, rerender, and state diff learning track.',
  description:
    'React 트랙은 실무에서 자주 마주치는 인증, 목록 조회, 상태 갱신 흐름을 실험형 세션으로 학습하기 위한 베이스 트랙입니다.',
  spec: [
    '실행 단위를 Session으로 보고 입력값, API, reducer, rerender를 한 흐름으로 설명합니다.',
    '학습자는 mock 조건과 입력을 직접 바꾸고 성공/실패/복원 케이스를 비교할 수 있습니다.',
    '각 기능은 상태 변화 이유와 업무 의미를 함께 보여주는 관찰형 playground로 설계됩니다.',
  ],
  groups: [
    {
      id: 'common',
      title: '공통',
      summary: '앱 초기화, 세션 복원, 공통 데이터 조회처럼 여러 화면이 공유하는 기반 흐름을 다룹니다.',
      intent: '서비스 공통 레이어가 어떻게 시작되고 안정화되는지 이해하는 그룹입니다.',
      features: [
        {
          id: 'mount-auth',
          title: '앱 초기화와 세션 복원',
          description: 'App mount 이후 auth check가 어떻게 실행되고 AUTH_RESTORE 또는 fallback으로 이어지는지 학습합니다.',
          to: '/chapter/mount-auth',
          status: 'ready',
        },
        {
          id: 'fetch-list',
          title: '공통 목록 조회',
          description: 'loading, success, error 상태를 분리하면서 리스트 데이터를 화면 상태로 반영하는 흐름을 봅니다.',
          to: '/chapter/list',
          status: 'ready',
        },
        {
          id: 'mutation',
          title: '공통 생성/삭제 처리',
          description: 'mutation 이후 reducer와 화면 상태가 어떻게 반응하는지 실험합니다.',
          to: '/chapter/mutation',
          status: 'ready',
        },
      ],
    },
    {
      id: 'login',
      title: '로그인 페이지',
      summary: '인증 입력, payload 생성, 응답 처리, 로그인 상태 반영처럼 로그인 화면의 핵심 흐름을 다룹니다.',
      intent: '로그인 화면이 단순 submit이 아니라 인증 상태 전환의 출발점임을 이해하는 그룹입니다.',
      features: [
        {
          id: 'login-flow',
          title: '로그인 요청과 인증 상태 반영',
          description: '입력값 수집부터 LOGIN_SUCCESS 또는 LOGOUT 분기까지 전체 로그인 세션을 추적합니다.',
          to: '/chapter/login',
          status: 'ready',
        },
      ],
    },
    {
      id: 'signup',
      title: '회원가입',
      summary: '폼 검증, request shape, 약관/중복 확인, 가입 완료 후 후속 상태 변경 같은 가입 흐름을 담을 예정입니다.',
      intent: '사용자 생성 과정의 검증과 상태 전환을 실험형으로 학습하기 위한 예정 그룹입니다.',
      features: [
        {
          id: 'signup-basic',
          title: '회원가입 기본 흐름',
          description: '폼 검증, 요청 생성, 가입 성공/실패 처리 시나리오를 추가할 예정입니다.',
          status: 'planned',
        },
      ],
    },
  ],
};

export function getReactGroup(groupId: string) {
  return reactTrack.groups.find((group) => group.id === groupId) ?? null;
}

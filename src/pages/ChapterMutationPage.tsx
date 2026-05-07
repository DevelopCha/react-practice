import { FormEvent, useEffect, useState } from 'react';
import { postApi } from '../api/postApi';
import { TraceMonitorLayout } from '../components/TraceMonitorLayout';
import { useCommon } from '../context/CommonContext';
import { usePostDispatch, usePostState } from '../context/PostContext';
import {
  ADD_POST_REQUEST,
  ADD_POST_SUCCESS,
  FETCH_POSTS_SUCCESS,
  POST_MUTATION_FAILURE,
  REMOVE_POST_REQUEST,
  REMOVE_POST_SUCCESS,
} from '../reducers/postActionTypes';
import { addFlowStep } from '../runtime/flowTracker';
import { addLog } from '../runtime/logger';
import type { MockServerFailure } from '../runtime/mockServer';
import { sleep } from '../runtime/sleep';
import { useRuntime } from '../runtime/RuntimeContext';
import type { FlowStep } from '../types/runtime';

const sampleLoadPreviewSteps: FlowStep[] = [
  {
    id: 'mutation-load-1',
    label: 'loadSamples()',
    meaning: 'Create/Delete 실험 전 샘플 목록을 준비하는 핸들러입니다.',
    data: {
      asIs: { postCount: 0 },
      toBe: { action: 'start sample load session' },
      reason: 'mutation 실험의 출발 목록을 준비합니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:76',
  },
  {
    id: 'mutation-load-2',
    label: '샘플 목록 request 구성',
    meaning: '샘플 목록을 가져오는 read 요청 조건을 고정합니다.',
    data: {
      asIs: { request: null },
      toBe: { request: { apiKey: 'users', purpose: 'load sample posts' } },
      reason: '샘플 목록 조회 조건을 먼저 고정합니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:88',
  },
  {
    id: 'mutation-load-3',
    label: 'dispatch FETCH_POSTS_SUCCESS',
    meaning: '샘플 응답을 reducer에 전달해 초기 목록을 채웁니다.',
    data: {
      asIs: { dispatched: false },
      toBe: { dispatched: true, actionType: 'FETCH_POSTS_SUCCESS' },
      reason: '샘플 조회 결과를 목록 상태로 반영하기 시작합니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:103',
  },
  {
    id: 'mutation-load-4',
    label: 'postReducer loads sample posts',
    meaning: '실험용 샘플 데이터가 PostContext에 반영됩니다.',
    data: {
      asIs: { postCount: 0 },
      toBe: { postCount: 'sample response length' },
      reason: '샘플 목록이 준비되어 생성/삭제 실험이 가능해집니다.',
    },
    codeLocation: 'src/reducers/postReducer.ts:28',
  },
  {
    id: 'mutation-load-5',
    label: 'rerender complete',
    meaning: '샘플 목록이 화면에 표시되어 이후 create/delete 실험이 가능해집니다.',
    data: {
      asIs: { visibleList: 'empty or old list' },
      toBe: { visibleList: 'sample post list' },
      reason: '사용자가 실험할 수 있는 기본 목록이 화면에 보입니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:132',
  },
];

const createPreviewSteps: FlowStep[] = [
  {
    id: 'mutation-create-1',
    label: 'handleCreateSubmit()',
    meaning: '사용자가 생성 실험을 시작하는 submit 핸들러입니다.',
    data: {
      asIs: { postCount: 'current list length' },
      toBe: { action: 'start create session' },
      reason: '새 post 생성 실험의 시작점입니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:149',
  },
  {
    id: 'mutation-create-2',
    label: '게시글 입력값 수집',
    meaning: 'title/body 값을 이번 Create Post Session의 고정 입력값으로 기록합니다.',
    data: {
      asIs: { title: '', body: '' },
      toBe: { title: 'input title', body: 'input body' },
      reason: '사용자 입력을 이번 세션의 고정값으로 사용합니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:161',
  },
  {
    id: 'mutation-create-3',
    label: 'create payload 생성',
    meaning: '폼 값을 create API와 reducer가 공유할 mutation payload로 변환합니다.',
    data: {
      asIs: { requestPayload: null },
      toBe: { requestPayload: { title: 'input title', body: 'input body' } },
      reason: 'API와 reducer가 이해할 request shape로 정리합니다.',
    },
    codeLocation: 'src/api/postApi.ts:13',
  },
  {
    id: 'mutation-create-4',
    label: 'dispatch ADD_POST_REQUEST',
    meaning: '중복 생성 클릭을 막고 처리 중 상태를 노출합니다.',
    data: {
      asIs: { loading: false },
      toBe: { loading: true, actionType: 'ADD_POST_REQUEST' },
      reason: '생성 중 상태를 먼저 반영합니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:177',
  },
  {
    id: 'mutation-create-5',
    label: 'dispatch ADD_POST_SUCCESS',
    meaning: '생성 성공 결과를 reducer에 전달합니다.',
    data: {
      asIs: { dispatched: false },
      toBe: { dispatched: true, actionType: 'ADD_POST_SUCCESS' },
      reason: '생성된 post를 실제 상태 변경 단계로 넘깁니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:193',
  },
  {
    id: 'mutation-create-6',
    label: 'postReducer prepends created post',
    meaning: '생성된 post가 기존 목록 맨 앞에 추가됩니다.',
    data: {
      asIs: { firstPost: 'previous first item', postCount: 'n' },
      toBe: { firstPost: 'created post', postCount: 'n + 1' },
      reason: '생성 성공 후 새 항목이 목록 맨 앞에 들어갑니다.',
    },
    codeLocation: 'src/reducers/postReducer.ts:56',
  },
  {
    id: 'mutation-create-7',
    label: 'rerender complete',
    meaning: '생성된 post가 화면 상단 목록에 바로 반영됩니다.',
    data: {
      asIs: { visibleList: 'before create' },
      toBe: { visibleList: 'created post shown at top' },
      reason: '생성 결과가 최종적으로 UI에 반영됩니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:223',
  },
];

const deletePreviewSteps: FlowStep[] = [
  {
    id: 'mutation-delete-1',
    label: 'handleDeleteClick(id)',
    meaning: '사용자가 특정 post를 삭제하는 실험을 시작합니다.',
    data: {
      asIs: { postCount: 'current list length' },
      toBe: { action: 'start delete session' },
      reason: '삭제 실험의 시작점입니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:228',
  },
  {
    id: 'mutation-delete-2',
    label: 'delete payload 생성',
    meaning: '선택한 post id를 삭제 API와 reducer가 공유할 payload로 고정합니다.',
    data: {
      asIs: { deleteId: null },
      toBe: { deleteId: 'selected post id' },
      reason: '삭제 대상 id를 고정해 API와 reducer가 같은 값을 바라보게 합니다.',
    },
    codeLocation: 'src/api/postApi.ts:18',
  },
  {
    id: 'mutation-delete-3',
    label: 'dispatch REMOVE_POST_REQUEST',
    meaning: '삭제 처리 중 상태를 먼저 반영합니다.',
    data: {
      asIs: { loading: false },
      toBe: { loading: true, actionType: 'REMOVE_POST_REQUEST' },
      reason: '삭제 처리 중 상태를 먼저 반영합니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:240',
  },
  {
    id: 'mutation-delete-4',
    label: 'dispatch REMOVE_POST_SUCCESS',
    meaning: '삭제 성공 결과를 reducer로 전달합니다.',
    data: {
      asIs: { dispatched: false },
      toBe: { dispatched: true, actionType: 'REMOVE_POST_SUCCESS' },
      reason: '삭제 성공 결과를 실제 상태 변경 단계로 전달합니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:256',
  },
  {
    id: 'mutation-delete-5',
    label: 'postReducer removes deleted post',
    meaning: 'deletedId와 일치하는 항목이 목록에서 제거됩니다.',
    data: {
      asIs: { postCount: 'n', removedId: null },
      toBe: { postCount: 'n - 1', removedId: 'selected post id' },
      reason: '삭제된 항목이 목록에서 빠집니다.',
    },
    codeLocation: 'src/reducers/postReducer.ts:67',
  },
  {
    id: 'mutation-delete-6',
    label: 'rerender complete',
    meaning: '삭제된 post가 목록에서 사라진 상태가 UI에 반영됩니다.',
    data: {
      asIs: { visibleList: 'before delete' },
      toBe: { visibleList: 'deleted item removed' },
      reason: '삭제 결과가 최종적으로 UI에 반영됩니다.',
    },
    codeLocation: 'src/pages/ChapterMutationPage.tsx:286',
  },
];

export function ChapterMutationPage() {
  const [title, setTitle] = useState('Reducer action note');
  const [body, setBody] = useState('Mutation requests update Context through dispatch.');
  const [pending, setPending] = useState(false);
  const postState = usePostState();
  const postDispatch = usePostDispatch();
  const { setActiveChapter } = useCommon();
  const { beginTraceSession, captureStateDiff, completeTraceSession, observe, refreshRuntimeSnapshot, setCallStack, setPreviewFlowSteps } = useRuntime();

  useEffect(() => {
    setActiveChapter('rc003 · Create/Delete Mutation');
    setPreviewFlowSteps(createPreviewSteps);
  }, [setActiveChapter, setPreviewFlowSteps]);

  const loadSamples = async () => {
    const beforeState = postState;
    let sessionResult = 'Load Sample Posts 완료';
    setPreviewFlowSteps(sampleLoadPreviewSteps);
    beginTraceSession('Load Sample Posts', 'loadSamples()', [
      'ChapterMutationPage.loadSamples',
      'postApi.fetchPosts',
      'axiosClient.get',
      'mockServer.request',
      'dispatch(FETCH_POSTS_SUCCESS)',
      'postReducer',
    ], { currentPostCount: postState.posts.length }, {
      meaning: 'Create/Delete 실험 전에 샘플 목록을 준비하는 핸들러입니다.',
      codeLocation: 'src/pages/ChapterMutationPage.tsx:76',
    });
    setPending(true);
    await sleep();

    observe('sample_fetch_request', { apiKey: 'users', purpose: 'mutation sample bootstrap' }, {
      label: '샘플 목록 request 구성',
      meaning: 'mutation 실험을 하기 전에 현재 목록을 준비하는 공통 read 요청을 실행합니다.',
      codeLocation: 'src/pages/ChapterMutationPage.tsx:88',
    });
    await sleep();

    postApi
      .fetchPosts()
      .then((response) => {
        addLog('Dispatch', 'dispatch(FETCH_POSTS_SUCCESS)');
        addFlowStep('dispatch FETCH_POSTS_SUCCESS', {
          meaning: '샘플 응답을 reducer에 전달해 실험용 기본 목록을 채웁니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
            },
            toBe: {
              type: FETCH_POSTS_SUCCESS,
              payload: { postCount: response.data.length, message: response.message },
            },
            reason: '실험용 샘플 목록을 reducer action으로 전달합니다.',
          },
          codeLocation: 'src/pages/ChapterMutationPage.tsx:103',
        });
        postDispatch({ type: FETCH_POSTS_SUCCESS, payload: { posts: response.data, message: response.message } });
        addFlowStep('postReducer loads sample posts', {
          meaning: '샘플 목록이 PostContext에 저장되어 create/delete 실험의 출발점이 됩니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
            },
            toBe: {
              postCount: response.data.length,
              firstPostTitle: response.data[0]?.title ?? null,
            },
            reason: '샘플 목록이 준비되어 mutation 실험의 출발 상태가 됩니다.',
          },
          codeLocation: 'src/reducers/postReducer.ts:28',
        });
        captureStateDiff(beforeState, { posts: response.data, loading: false, error: null, message: response.message }, 'FETCH_POSTS_SUCCESS dispatch completed. response.data가 posts 상태를 대체합니다.');
        sessionResult = `Sample load 성공: ${response.data.length}개의 샘플 post가 준비되었습니다.`;
      })
      .finally(() => {
        setPending(false);
        addLog('Render', 'Mutation list rerendered after sample load');
        addFlowStep('rerender complete', {
          meaning: '샘플 목록이 UI에 반영되어 생성/삭제 실험을 바로 시작할 수 있습니다.',
          codeLocation: 'src/pages/ChapterMutationPage.tsx:132',
        });
        refreshRuntimeSnapshot();
        completeTraceSession(sessionResult);
      });
  };

  const handleInput = (field: 'title' | 'body', value: string) => {
    if (field === 'title') {
      setTitle(value);
    } else {
      setBody(value);
    }
    setCallStack(['onChange()', 'setLocalFormState()']);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const beforeState = postState;
    setPending(true);
    let sessionResult = 'Create Post 실험 완료';
    setPreviewFlowSteps(createPreviewSteps);
    beginTraceSession('Create Post', 'handleCreateSubmit()', [
      'ChapterMutationPage.handleCreateSubmit',
      'dispatch(ADD_POST_REQUEST)',
      'postApi.createPost',
      'axiosClient.post',
      'mockServer.request',
      'dispatch(ADD_POST_SUCCESS | POST_MUTATION_FAILURE)',
      'postReducer',
    ], { title, body }, {
      meaning: '사용자가 생성 실험을 시작하는 submit 핸들러입니다.',
      codeLocation: 'src/pages/ChapterMutationPage.tsx:149',
    });
    await sleep();

    observe('create_input_collect', { title, body }, {
      label: '게시글 입력값 수집',
      meaning: 'Input Lab의 title/body 값을 이번 Create Post Session의 실험 입력으로 고정합니다.',
      codeLocation: 'src/pages/ChapterMutationPage.tsx:161',
    });
    await sleep();

    observe('create_payload_build', { requestPayload: { title, body } }, {
      label: 'create payload 생성',
      meaning: '폼 상태를 postApi.createPost가 받을 mutation payload로 변환합니다.',
      codeLocation: 'src/api/postApi.ts:13',
    });
    await sleep();

    addLog('Dispatch', 'dispatch(ADD_POST_REQUEST)');
    addFlowStep('dispatch ADD_POST_REQUEST', {
      meaning: '생성 중 상태를 켜고 중복 submit을 방지합니다.',
      data: {
        asIs: {
          loading: beforeState.loading,
          postCount: beforeState.posts.length,
        },
        toBe: {
          type: ADD_POST_REQUEST,
          loading: true,
          requestPayload: { title, body },
        },
        reason: '생성 처리 중 상태와 요청 payload를 고정합니다.',
      },
      codeLocation: 'src/pages/ChapterMutationPage.tsx:177',
    });
    postDispatch({ type: ADD_POST_REQUEST });
    await sleep();

    postApi
      .createPost({ title, body })
      .then((response) => {
        addLog('Dispatch', 'dispatch(ADD_POST_SUCCESS)');
        addFlowStep('dispatch ADD_POST_SUCCESS', {
          meaning: '생성 성공 응답을 reducer에 전달해 목록에 새 post를 삽입합니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
            },
            toBe: {
              type: ADD_POST_SUCCESS,
              payload: { createdId: response.data.id, title: response.data.title },
            },
            reason: '생성된 post를 reducer action으로 전달합니다.',
          },
          codeLocation: 'src/pages/ChapterMutationPage.tsx:193',
        });
        postDispatch({ type: ADD_POST_SUCCESS, payload: { post: response.data, message: response.message } });
        addFlowStep('postReducer prepends created post', {
          meaning: '새로 만든 post가 목록 맨 앞에 추가되고 message도 함께 갱신됩니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
              firstPostTitle: beforeState.posts[0]?.title ?? null,
            },
            toBe: {
              postCount: beforeState.posts.length + 1,
              firstPostTitle: response.data.title,
              message: response.message,
            },
            reason: '생성된 post가 목록 맨 앞에 삽입됩니다.',
          },
          codeLocation: 'src/reducers/postReducer.ts:56',
        });
        captureStateDiff(beforeState, {
          posts: [response.data, ...beforeState.posts],
          loading: false,
          error: null,
          message: response.message,
        }, 'ADD_POST_SUCCESS dispatch completed. 생성된 post가 목록 맨 앞에 추가됩니다.');
        sessionResult = `Create 성공: "${response.data.title}" post가 목록 맨 앞에 추가되었습니다.`;
      })
      .catch((error: MockServerFailure) => {
        const errorMessage = error.response?.message ?? 'create failed';
        observe('create_failure', { error: error.response ?? { message: errorMessage } }, {
          label: '생성 실패 응답 처리',
          meaning: '실패 응답은 목록을 유지한 채 error 상태만 남기도록 정리합니다.',
          codeLocation: 'src/pages/ChapterMutationPage.tsx:208',
        });
        addLog('Dispatch', 'dispatch(POST_MUTATION_FAILURE)');
        addFlowStep('dispatch POST_MUTATION_FAILURE', {
          meaning: '생성 실패 결과를 reducer에 전달해 목록은 유지하고 error를 표시합니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
              error: beforeState.error,
            },
            toBe: {
              type: POST_MUTATION_FAILURE,
              payload: { error: errorMessage },
            },
            reason: '생성 실패를 mutation error action으로 전달합니다.',
          },
          codeLocation: 'src/pages/ChapterMutationPage.tsx:213',
        });
        postDispatch({ type: POST_MUTATION_FAILURE, payload: { error: errorMessage } });
        addFlowStep('postReducer renders mutation error', {
          meaning: '기존 목록은 그대로 두고 error만 채워 사용자에게 실패를 보여줍니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
              error: beforeState.error,
            },
            toBe: {
              postCount: beforeState.posts.length,
              error: errorMessage,
            },
            reason: '실패해도 목록은 유지하고 에러 메시지만 갱신합니다.',
          },
          codeLocation: 'src/reducers/postReducer.ts:78',
        });
        captureStateDiff(beforeState, { ...beforeState, loading: false, error: errorMessage, message: null }, 'POST_MUTATION_FAILURE dispatch completed. 목록은 유지되고 error만 표시됩니다.');
        sessionResult = `Create 실패: ${errorMessage}`;
      })
      .finally(() => {
        setPending(false);
        addLog('Render', 'Post list rerendered after create');
        addFlowStep('rerender complete', {
          meaning: '생성 결과가 목록과 에러 메시지에 반영되어 사용자에게 최종 상태가 보입니다.',
          codeLocation: 'src/pages/ChapterMutationPage.tsx:223',
        });
        refreshRuntimeSnapshot();
        completeTraceSession(sessionResult);
      });
  };

  const handleDelete = async (id: number) => {
    const beforeState = postState;
    setPending(true);
    let sessionResult = 'Delete Post 실험 완료';
    setPreviewFlowSteps(deletePreviewSteps);
    beginTraceSession('Delete Post', `handleDeleteClick(${id})`, [
      'ChapterMutationPage.handleDeleteClick',
      'dispatch(REMOVE_POST_REQUEST)',
      'postApi.deletePost',
      'axiosClient.delete',
      'mockServer.request',
      'dispatch(REMOVE_POST_SUCCESS | POST_MUTATION_FAILURE)',
      'postReducer',
    ], { deleteId: id }, {
      meaning: '사용자가 특정 post를 삭제하는 실험을 시작합니다.',
      codeLocation: 'src/pages/ChapterMutationPage.tsx:228',
    });
    await sleep();

    observe('delete_payload_build', { requestPayload: { deletedId: id } }, {
      label: 'delete payload 생성',
      meaning: '사용자가 선택한 post id를 삭제 API와 reducer가 공유할 payload로 고정합니다.',
      codeLocation: 'src/api/postApi.ts:18',
    });
    await sleep();

    addLog('Dispatch', 'dispatch(REMOVE_POST_REQUEST)');
    addFlowStep('dispatch REMOVE_POST_REQUEST', {
      meaning: '삭제 처리 중 상태를 먼저 반영해 중복 삭제를 막습니다.',
      data: {
        asIs: {
          loading: beforeState.loading,
          postCount: beforeState.posts.length,
        },
        toBe: {
          type: REMOVE_POST_REQUEST,
          loading: true,
          deleteId: id,
        },
        reason: '삭제 대상 id를 고정하고 처리 중 상태를 먼저 반영합니다.',
      },
      codeLocation: 'src/pages/ChapterMutationPage.tsx:240',
    });
    postDispatch({ type: REMOVE_POST_REQUEST });
    await sleep();

    postApi
      .deletePost(id)
      .then((response) => {
        addLog('Dispatch', 'dispatch(REMOVE_POST_SUCCESS)');
        addFlowStep('dispatch REMOVE_POST_SUCCESS', {
          meaning: '삭제 성공 결과를 reducer에 전달해 대상 항목을 제거합니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
              deleteId: id,
            },
            toBe: {
              type: REMOVE_POST_SUCCESS,
              payload: { deletedId: response.data.deletedId, message: response.message },
            },
            reason: '삭제 완료된 id를 reducer action으로 전달합니다.',
          },
          codeLocation: 'src/pages/ChapterMutationPage.tsx:256',
        });
        postDispatch({ type: REMOVE_POST_SUCCESS, payload: { id: response.data.deletedId, message: response.message } });
        addFlowStep('postReducer removes deleted post', {
          meaning: 'deletedId와 일치하는 항목이 posts 배열에서 제거됩니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
            },
            toBe: {
              postCount: Math.max(beforeState.posts.length - 1, 0),
              removedId: response.data.deletedId,
              message: response.message,
            },
            reason: '삭제된 항목이 목록에서 제거됩니다.',
          },
          codeLocation: 'src/reducers/postReducer.ts:67',
        });
        captureStateDiff(beforeState, {
          posts: beforeState.posts.filter((post) => post.id !== response.data.deletedId),
          loading: false,
          error: null,
          message: response.message,
        }, 'REMOVE_POST_SUCCESS dispatch completed. deletedId와 일치하는 post가 목록에서 제거됩니다.');
        sessionResult = `Delete 성공: id ${response.data.deletedId} post가 목록에서 제거되었습니다.`;
      })
      .catch((error: MockServerFailure) => {
        const errorMessage = error.response?.message ?? 'delete failed';
        observe('delete_failure', { error: error.response ?? { message: errorMessage } }, {
          label: '삭제 실패 응답 처리',
          meaning: '삭제 실패 시 기존 목록은 유지하고 error 상태만 남겨 안전하게 복구합니다.',
          codeLocation: 'src/pages/ChapterMutationPage.tsx:271',
        });
        addLog('Dispatch', 'dispatch(POST_MUTATION_FAILURE)');
        addFlowStep('dispatch POST_MUTATION_FAILURE', {
          meaning: '삭제 실패 결과를 reducer에 전달해 목록은 유지하고 error만 표시합니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
              error: beforeState.error,
            },
            toBe: {
              type: POST_MUTATION_FAILURE,
              payload: { error: errorMessage },
            },
            reason: '삭제 실패를 mutation error action으로 전달합니다.',
          },
          codeLocation: 'src/pages/ChapterMutationPage.tsx:276',
        });
        postDispatch({ type: POST_MUTATION_FAILURE, payload: { error: errorMessage } });
        addFlowStep('postReducer renders mutation error', {
          meaning: '삭제 실패 시 posts는 유지되고 error만 갱신됩니다.',
          data: {
            asIs: {
              postCount: beforeState.posts.length,
              error: beforeState.error,
            },
            toBe: {
              postCount: beforeState.posts.length,
              error: errorMessage,
            },
            reason: '삭제 실패 시 목록을 유지하고 에러 메시지만 갱신합니다.',
          },
          codeLocation: 'src/reducers/postReducer.ts:78',
        });
        captureStateDiff(beforeState, { ...beforeState, loading: false, error: errorMessage, message: null }, 'POST_MUTATION_FAILURE dispatch completed. 목록은 유지되고 error만 표시됩니다.');
        sessionResult = `Delete 실패: ${errorMessage}`;
      })
      .finally(() => {
        setPending(false);
        addLog('Render', 'Post list rerendered after delete');
        addFlowStep('rerender complete', {
          meaning: '삭제 결과가 목록과 에러 메시지에 반영되어 사용자에게 최종 상태가 보입니다.',
          codeLocation: 'src/pages/ChapterMutationPage.tsx:286',
        });
        refreshRuntimeSnapshot();
        completeTraceSession(sessionResult);
      });
  };

  return (
    <TraceMonitorLayout
      title="rc003 · Create/Delete Mutation"
      subtitle="Run a common mutation session and inspect create/delete payloads, reducer updates, and rerender results."
      rawState={postState}
      rawStateLabel="PostContext"
      apiLabKeys={['users', 'write', 'delete']}
      processGuide={
        <>
          <p>생성/삭제 mutation은 기존 목록을 바꾸는 흐름이다. 요청 전 loading, 성공 후 목록 갱신, 실패 후 복구 메시지가 핵심이다.</p>
          <ol>
            <li><strong>request action</strong>: 중복 실행을 막고 사용자에게 처리 중임을 알려준다.</li>
            <li><strong>mutation API</strong>: 입력값이나 id를 서버가 이해할 payload로 보낸다.</li>
            <li><strong>success/failure reducer</strong>: 성공 시 목록을 변경하고 실패 시 기존 목록을 보존하며 error를 보여준다.</li>
          </ol>
        </>
      }
      actionPanel={
        <div className="mini-stack">
          <button type="button" onClick={loadSamples} disabled={pending}>
            Load sample posts
          </button>
          <form className="mini-stack" onSubmit={handleCreate}>
            <label>
              Title
              <input value={title} onChange={(event) => handleInput('title', event.target.value)} />
            </label>
            <label>
              Body
              <textarea value={body} onChange={(event) => handleInput('body', event.target.value)} />
            </label>
            <button type="submit" disabled={pending}>
              Create post
            </button>
          </form>
          {postState.error && <p className="error-text">{postState.error}</p>}
          <ul className="post-list compact">
            {postState.posts.map((post) => (
              <li key={post.id}>
                <strong>{post.title}</strong>
                <button type="button" onClick={() => handleDelete(post.id)} disabled={pending}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      }
      notes={
        <>
          <p>
            Index: <code>rc003</code>
          </p>
          <p>
            Component: <code>src/pages/ChapterMutationPage.tsx</code>
          </p>
          <p>
            API: <code>src/api/postApi.ts</code>
          </p>
          <p>
            Reducer: <code>src/reducers/postReducer.ts</code>
          </p>
          <p>
            Create path: <code>handleCreateSubmit -&gt; postApi.createPost -&gt; axiosClient.post -&gt; mockServer.request -&gt; ADD_POST_SUCCESS</code>
          </p>
          <p>
            Delete path: <code>handleDeleteClick -&gt; postApi.deletePost -&gt; axiosClient.delete -&gt; mockServer.request -&gt; REMOVE_POST_SUCCESS</code>
          </p>
          <p>
            Mock: <code>?mock=write:500:create-failed,delete:500:delete-failed</code>
          </p>
        </>
      }
    />
  );
}

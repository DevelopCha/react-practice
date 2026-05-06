export type MockStatusConfig = {
  status: number;
  message: string;
};

export type MockQueryMap = Record<string, MockStatusConfig>;

const MOCK_QUERY_KEY = 'mock';

function getCurrentSearchParams() {
  if (typeof window === 'undefined') {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search);
}

export function parseMockQuery(searchParams: URLSearchParams = getCurrentSearchParams()): MockQueryMap {
  const mockValue = searchParams.get(MOCK_QUERY_KEY);

  if (!mockValue) {
    return {};
  }

  return mockValue.split(',').reduce<MockQueryMap>((result, rawToken) => {
    const token = rawToken.trim();

    if (!token) {
      return result;
    }

    const [apiKey, statusText, ...messageParts] = token.split(':');
    const status = Number(statusText);
    const message = messageParts.join(':');

    if (!apiKey || !Number.isInteger(status) || !message) {
      return result;
    }

    result[apiKey] = {
      status,
      message,
    };

    return result;
  }, {});
}

export function getMockConfig(apiKey: string, fallback: MockStatusConfig): MockStatusConfig {
  return parseMockQuery()[apiKey] ?? fallback;
}

interface GetOptions {
  url: string
  success?: Function
  fail?: Function
  withCredentials?: boolean
}

interface PostOptions {
  url: string
  data?: string
  success?: Function
  fail?: Function
}

export interface SdkTransport {
  get: (options: GetOptions) => void
  post: (options: PostOptions) => void
}

const request = (method: 'GET' | 'POST', options: any) => {
  const { url, data, success, fail } = options;
  fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data,
  })
    .then((response) => {
      response.json().then(res => { success(res) }).catch(reason => { fail && fail(reason) })
    })
    .catch((reason) => fail && fail(reason))
};

const getFetchTransport = () => ({
  get(options: any) {
    request('GET', options);
  },
  post(options: any) {
    request('POST', options);
  },
});
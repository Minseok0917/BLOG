---
title: clean-axios
description: API 모듈화를 직관적이게 작성하는 방법
---

# clean-axios

`작성일자 : 2023.03.21`

예전에 [작성한 글](https://minseok0917.github.io/TIL/2022/2%EB%B6%84%EA%B8%B0/1115.html)을 다시 옮겨서 새로 작성한 글입니다.

- [github](https://github.com/Minseok0917/clean-axios)

## 프롤로그

회사 SI 프로젝트에서 프론트엔드 리드를 담당하면서 마음에 들지 않았던 부분이 있었습니다.  
대표적으로 API 를 선언하는 부분이었습니다.

현 프로젝트에서는 아래와 같은 형식으로 API 를 선언했습니다.

```javascript
export const fetchUser = () => backendAPI.get("/user/read");
export const createUser = (userInfo) =>
  backendAPI.post("/user/create", { userInfo });
export const updateUser = (userInfo) =>
  backendAPI.post("/user/update", { userInfo });
export const deleteUser = (userInfo) =>
  backendAPI.post("/user/delete", { userInfo });
```

## 코드 스타일 정리해보기

우선 API를 선언하는 방법을 4가지 정도로 작성하였고,  
카카오톡 오픈톡방에서 코드를 공유하여 선호하는 코드 번호를 여쭤봤습니다.

대부분 2번이 직관적이고 보기 좋다는 답변이 많았습니다.

**[투표 결과]**

- 1번 : 5명
- 2번 : 12명
- 3번 : 2명
- 4번 : 5명

```javascript
// 1번
export const fetchUser = (userId) =>
  backendAPI.get("/user/read", { params: { userId } });

// 2번
export function fetchUser(userId) {
  return backendAPI({
    method: "get",
    url: "/user/read",
    params: { userId },
  });
}

// 3번
export const fetchUser = (userId) => {
  return backendAPI.get("/user/read", { params: { userId } });
};

// 4번
export const fetchUser = (userId) =>
  backendAPI({
    method: "get",
    url: "/user/read",
    params: { userId },
  });
```

## 코드 작성해보기

투표에서 제일 많이 뽑힌 코드 스타일로 작성해봤습니다.  
코드가 직관적이라서 이해가 잘 되네요.

하지만 중복되는 요소가 많아 선언 방법을 더 개선하기로 합니다.

```javascript
export function fetchUser(userId) {
  return backendAPI({
    method: "get",
    url: "/user/read",
    params: { userId },
  });
}
export function createUser(userInfo) {
  return backendAPI({
    method: "post",
    url: "/user/create",
    data: userInfo,
  });
}
export function updateUser(userInfo) {
  return backendAPI({
    method: "post",
    url: "/user/update",
    data: userInfo,
  });
}
export function deleteUser(userInfo) {
  return backendAPI({
    method: "post",
    url: "/user/delete",
    data: userInfo,
  });
}
```

## 코드 스타일 개선하기

개선을 할 땐 보기 좋으며, 짧은 코드를 추구했습니다.  
그렇게 아래와 같은 형식으로 유틸 함수를 통해서 API 선언문을 완성했습니다.

```javascript
// src/utils/util.axios.js
export function createAPIService(instance, instanceObjectAPI) {
  const instanceMap = ([key, callback]) => [
    key,
    (...parameters) => instance(callback(...parameters)),
  ];
  return Object.fromEntries(Object.entries(instanceObjectAPI).map(instanceMap));
}
```

```javascript
// src/services/service.user
import { createAPIService } from "@utils/util.axios";
import { backendAPI } from "@services";

export const USER_SERVICES = createAPIService(backendAPI, {
  fetchUser: (userId) => ({
    method: "get",
    url: "/user/read",
    params: { userId },
  }),
  createUser: (userInfo) => ({
    method: "post",
    url: "/user/create",
    data: userInfo,
  }),
  updateUser: (userInfo) => ({
    method: "post",
    url: "/user/update",
    data: userInfo,
  }),
  deleteUser: (userInfo) => ({
    method: "post",
    url: "/user/delete",
    data: userInfo,
  }),
});

export const {
  fetchUser, // 조회
  createUser, // 생성
  updateUser, // 수정
  deleteUser, // 삭제
} = USER_SERVICES;
```

## 새로 추가된 3가지의 유틸 함수

### GROUP 기준으로 분류하기

```javascript
// src/utils/util.axios.js
export function createGroupAPIService(instance, instanceObjectAPI) {
  return Object.fromEntries(
    Object.entries(instanceObjectAPI).map(([key, value]) => [
      key,
      createAPIService(instance, value),
    ])
  );
}
```

```javascript
// src/services/service.user.js
import { createGroupAPIService } from "@utils/util.axios.js";
import { backendAPI } from "@services";

export const GROUP_API_SERVICES = createGroupAPIService(backendAPI, {
  USER_SERVICES: {
    fetchUser: () => ({
      method: "get",
      url: "/user/read",
    }),
    createUser: (userInfo) => ({
      method: "post",
      url: "/user/create",
      data: userInfo,
    }),
    updateUser: (userInfo) => ({
      method: "post",
      url: "/user/update",
      data: userInfo,
    }),
    deleteUser: (userInfo) => ({
      method: "post",
      url: "/user/delete",
      data: userInfo,
    }),
  },
});
export const { USER_SERVICES } = GROUP_API_SERVICES;
export const {
  fetchUser, // 유저 조회
  createUser, // 유저 생성
  updateUser, // 유저 수정
  deleteUser, // 유저 삭제
} = USER_SERVICES;
```

### METHOD 기준으로 분류하기

```javascript
// src/utils/util.axios.js
export function createMethodAPIService(instance, instanceObjectAPI) {
  return Object.fromEntries(
    Object.entries(instanceObjectAPI)
      .filter(([method]) =>
        ["get", "post", "put", "delete"].includes(method.toLocaleLowerCase())
      )
      .map(([method, value]) => {
        const instanceMap = ([key, callback]) => [
          key,
          (...parameters) => instance({ ...callback(...parameters), method }),
        ];
        return [
          method,
          Object.fromEntries(Object.entries(value).map(instanceMap)),
        ];
      })
  );
}
```

```javascript
// src/services/service.user.js
import { createMethodAPIService } from "@utils/util.axios.js";
import { backendAPI } from "@services";

export const USER_SERVICES = createMethodAPIService(backendAPI, {
  get: {
    fetchUser: () => ({
      url: "/user/read",
    }),
  },
  post: {
    createUser: (userInfo) => ({
      url: "/user/create",
      data: userInfo,
    }),
    updateUser: (userInfo) => ({
      url: "/user/update",
      data: userInfo,
    }),
    deleteUser: (userInfo) => ({
      url: "/user/delete",
      data: userInfo,
    }),
  },
});
export const {
  get: {
    fetchUser, // 유저 조회
  },
  post: {
    createUser, // 유저 생성
    updateUser, // 유저 수정
    deleteUser, // 유저 삭제
  },
} = USER_METHOD_API_SERVICES;
```

### GROUP + METHOD 합치기

```javascript
// /src/utils/util.axios.js
export function createGroupMethodAPIService(instance, instanceObjectAPI) {
  return Object.fromEntries(
    Object.entries(instanceObjectAPI).map(([key, value]) => [
      key,
      createMethodAPIService(instance, value),
    ])
  );
}
```

```javascript
// src/services/service.user.js
import { createGroupMethodAPIService } from "@utils/util.axios.js";
import { backendAPI } from "@services";

const GROUP_METHOD_API_SERVICES = createGroupMethodAPIService(backendAPI, {
  USER_SERVICES: {
    get: {
      fetchUser: () => ({
        url: "/user/read",
      }),
    },
    post: {
      createUser: (userInfo) => ({
        url: "/user/create",
        data: userInfo,
      }),
      updateUser: (userInfo) => ({
        url: "/user/update",
        data: userInfo,
      }),
      deleteUser: (userInfo) => ({
        url: "/user/delete",
        data: userInfo,
      }),
    },
  },
});
export const { USER_SERVICES } = GROUP_METHOD_API_SERVICES;
export const {
  get: {
    fetchUser, // 유저 조회
  },
  post: {
    createUser, // 유저 생성
    updateUser, // 유저 수정
    deleteUser, // 유저 삭제
  },
} = USER_SERVICES;
```

## 마무리

긴 글 읽어주셔서 감사합니다.

현재는 매번 utils/util.axios 라는 파일에 복붙해서 사용하고 있는데요.  
언젠간 clean-axios 라는 이름으로 Typescript 를 적용해서 NPM 에 배포할 예정입니다.

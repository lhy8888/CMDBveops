 /* eslint-dsiable */
import Vue from 'vue'
import axios from 'axios'
import { VueAxios } from './axios'
import message from 'ant-design-vue/es/message'
import notification from 'ant-design-vue/es/notification'
import { ACCESS_TOKEN } from '@/store/global/mutation-types'
import router from '@/router'
import store from '@/store'
import i18n from '@/lang'

// 创建 axios 实例
const service = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL, // api base_url
  timeout: 6000, // 请求超时时间
  withCredentials: true,
  crossDomain: true,
})

const err = (error = {}) => {
  try {
    console.log(error)
    const isServerError = (statusCode) => /^5\d{2}$/.test(String(statusCode || ''))
    const response = (error && error.response && typeof error.response === 'object') ? error.response : {}
    const config = (error && error.config && typeof error.config === 'object') ? error.config : {}
    const status = Number(response.status || 0)

    if (status && isServerError(status)) {
      const errorMsg = (response.data || {}).message || i18n.t('requestServiceError')
      message.error(errorMsg)
    } else if (status === 412) {
      let seconds = 5
      notification.warning({
        key: 'notification',
        message: 'WARNING',
        description: i18n.t('requestWait', {
          time: 5,
        }),
        duration: 5,
      })
      let interval = setInterval(() => {
        seconds -= 1
        if (seconds === 0) {
          clearInterval(interval)
          interval = null
          return
        }
        notification.warning({
          key: 'notification',
          message: 'WARNING',
          description: i18n.t('requestWait', {
            time: seconds,
          }),
          duration: seconds
        })
      }, 1000)
    } else if (config.url === '/api/v0.1/ci_types/can_define_computed' || config.isShowMessage === false) {
    } else {
      const errorMsg = (response.data || {}).message || i18n.t('requestError')
      message.error(`${errorMsg}`)
    }

    if (status) {
      console.log(config.url)
      const currentPath = (router.currentRoute || {}).path || router.path
      if (status === 401 && currentPath === '/user/login') {
        window.location.href = '/user/logout'
      }
    }
  } catch (handlerError) {
    console.error('axios error handler crashed:', handlerError)
    message.error(i18n.t('requestError'))
  }

  return Promise.reject(error)
}

// request interceptor
service.interceptors.request.use(config => {
  const token = Vue.ls.get(ACCESS_TOKEN)
  if (token) {
    config.headers['Access-Token'] = token // 让每个请求携带自定义 token 请根据实际情况自行修改
  }
  config.headers['Accept-Language'] = store?.state?.locale ?? 'zh'
  return config
}, err)

// response interceptor
service.interceptors.response.use((response) => {
  return response.data
}, err)

const installer = {
  vm: {},
  install(Vue) {
    Vue.use(VueAxios, service)
  }
}

export {
  installer as VueAxios,
  service as axios
}

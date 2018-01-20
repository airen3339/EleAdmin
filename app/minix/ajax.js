import $http from 'axios';
import Qs from 'qs';

// $http.defaults.withCredentials = true;

export default {
  methods: {
    /**
     * url 处理
     */
    createUrl (url = '') {
      if (window.createUrl) return window.createUrl(url);
      return url;
    },

    /**
     * 添加提示的Action
     *
     */
    warningAction (act, value = null, cbRedirect = null, onSuccess = null) {
      /**
       * 提示动作
       */
      let handle = (config, func) => {
        return this.$confirm(config.msg, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(func).catch(() => {
          this.$message({
            type: 'info',
            message: '已取消'
          });
        });
      };
      if (act.confirm) {
        return handle(act.confirm, () => {
          return this.action(act, value, cbRedirect, onSuccess);
        });
      } else {
        return this.action(act, value, cbRedirect, onSuccess);
      }
    },

    /**
     * 分装的处理函数
     *
     * @param {Object} act - 动作描述
     *
     * @param {Function} cbRedirect
     * @param {Function} onSuccess 后续动作
     *
     * @param {bool} act.post - 是否是表单方式
     * @param {string} act.url - 目标地址
     * @param act.api - 在线提交+参数过滤
     * @param act.key - 跳转参数过滤
     * @param {Object} value - 参数
     *
     *
     */
    action (act, value = null, cbRedirect = null, onSuccess = null) {
      // 用于form提交
      if (act.post) {
        return this.ajax(act, value).then(onSuccess);
      }

      // 用于在线按钮
      if (act.api) {
        value = queryStringFilter(value, act.api);
        return this.ajax(act, value).then(onSuccess);
      }

      if (!cbRedirect) return;

      // 带id跳转
      if (act.key) value = queryStringFilter(value, act.key);

      return cbRedirect(act, value);
    },

    /**
     * 发送异步请求
     *
     * @param {string} url - 目标地址
     * @param {Object} value - 参数
     * @param {boolean} [post = false] - 是否是表单方式
     *
     * @return {Promise.<T>}
     */
    ajax ({url = '', post = false}, value) {
      let option = {
        method: post ? 'post' : 'get',
        url: this.createUrl(url)
      };
      if (post) {
        option.data = Qs.stringify(value);
        option.headers = {'Content-Type': 'application/x-www-form-urlencoded'};
      } else if (value !== null) {
        option.params = JSON.parse(JSON.stringify(value));
      }
      // 开启跨域cookie
      option.withCredentials = true;

      console.log('url:' + option.url);

      let self = this;
      function onError (data, message) {
        self.$message({
          type: 'warning',
          message: data.message || message
        });
      }
      return $http(option).then((response) => {
        let data = response.data;
        // 判断返回结果信息
        if ((function (data) {
          if (typeof data !== 'object') return false;
          if (data.status === false) return true;
          return (data.status && Number(data.status) <= 0);
        })(data)) {
          onError(data, '操作无效');
        } else {
          return data;
        }
      }, (error) => {
        onError(error, '数据获取失败');
      }).catch((error) => {
        onError(error, '内部错误');
      });
    }
  }
};

/**
 * queryString过滤
 */
function queryStringFilter (value, filter) {
  if (filter === true) filter = 'id';
  if (typeof filter === 'string') filter = [{key: filter, value: 'id'}];
  let fp = {};
  filter.forEach((v) => { fp[v.key] = value[v.value]; });
  return fp;
}

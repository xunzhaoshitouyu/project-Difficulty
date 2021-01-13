/*
 * @Date: 2021-01-13 17:39:10 
 * @Last Modified time: 2021-01-13 17:47:56
 */


/**
 * @description 基于egg开发的文件自动上传程序示
 * @export
 * @class UploadController
 */
export default class UploadController {
  /**
   * @description 读取服务器文件上传到oss并落库
   * @memberof UploadController
   */
  public async readAndUploadFile() {
    const oss = new Oss({
      env: 'env'
    });
    try {
      const dirname = 'c://demo/file'; // 要扫描的目录

      // 读取文件夹下的文件
      let willUploadFileList = this.readFileFromDirectory(dirname);
      // 文件排序，优先上传文件
      this.sortFileList(willUploadFileList);

      // 任务开始时间
      let taskStartTime = new Date().getTime();

      while (willUploadFileList.length) {
        let cover_imgurl = 'https://pics4.baidu.com/feed/6a600c338744ebf8fac9d08ddeac342d6159a7a1.jpeg?token=15c98c473058d3435cb654f91b23bd57&s=D382D20456FB1D8E3A1492B1030050A1'; // 封面图
        let show_imgurl = 'https://pics4.baidu.com/feed/6a600c338744ebf8fac9d08ddeac342d6159a7a1.jpeg?token=15c98c473058d3435cb654f91b23bd57&s=D382D20456FB1D8E3A1492B1030050A1'; // 展示图
        let fileName;
        fileName = willUploadFileList.shift();

        const isDirectory = this.isDirectory(fileName);
        // 如果是文件夹
        if (isDirectory) {
          const files = this.readFileFromDirectory(fileName);
          willUploadFileList = willUploadFileList.concat(files);
          this.sortFileList(willUploadFileList);
        }

        // 如果是文件
        if (!isDirectory) {
          const REG = /\.(jpg|gif|jpeg|png|ai|mp3|fla|psd)$/i; // 需要上传的文件类型
          const verifyPicFileReg = /\.(jpg|gif|jpeg|png)$/i; // 校验是不是图片文件
          const validFile = REG.test(fileName);
          const isPic = verifyPicFileReg.test(fileName);
          if (validFile) {
            const originName = fileName.split('/').pop();
            const file_type = path.extname(fileName).split('.')[1];

            let res;
            let startTime = new Date().getTime();
            let endTime = new Date().getTime();

            // 开始上传
            try {
              res = await oss.multipartUpload(fileName, () => {});
              endTime = new Date().getTime();
              const elapsed = (endTime - startTime) / 1000;
              this.service.uploadFile.addUploadLog({
                path: fileName,
                status: '上传成功',
                elapsed
              });
            } catch (error) {
              endTime = new Date().getTime();

              const elapsed = (endTime - startTime) / 1000;
              this.service.uploadFile.addUploadLog({
                path: fileName,
                status: '上传失败',
                errmsg: error.message,
                elapsed
              });
            }

            if (isPic) {
              cover_imgurl = res;
              show_imgurl = res;
            }

            // 开始入库
            try {
              const {
                affectedRows,
                message
              } = await this.service.uploadFile.saveFile({
                name: originName,
                username: '陈晨06',
                resource_url: res,
                file_type,
                keywords: originName,
                cover_imgurl,
                show_imgurl
              });
              if (affectedRows) {
                ctx.successHandler({ msg: '入库成功' });
              } else {
                ctx.failHander(message);
                this.service.uploadFile.addUploadLog({
                  path: fileName,
                  status: '入库失败',
                  errmsg: message
                });
              }
            } catch (error) {
              this.service.uploadFile.addUploadLog({
                path: fileName,
                status: '入库失败',
                errmsg: error.message
              });
            }
          }
        }
      }

      // 任务结束时间
      let taskEndTime = new Date().getTime();

      let taskTime = (taskEndTime - taskStartTime) / 1000;
      // 记录任务总的执行时间
      this.service.uploadFile.addUploadLog({
        path: '所有文件上传完成',
        status: '上传完成',
        elapsed: taskTime
      });
    } catch (error) {
      this.service.uploadFile.addUploadLog({
        path: '未知路径',
        status: '上传错误',
        errmsg: error.message
      });
      ctx.errorHandler(error);
    }
  }

  /**
   * @description 判断是否是文件夹
   * @private
   * @param {*} path 路径
   * @return {*}
   * @memberof UploadController
   */
  private isDirectory(path) {
    const stat = fs.statSync(path);
    return stat.isDirectory(); // 判断是否是文件
  }

  /**
   * @description 从文件夹读取文件
   * @private
   * @param {*} dirname 文件夹名称
   * @memberof UploadController
   */
  private readFileFromDirectory(dirname) {
    const files = fs.readdirSync(dirname);
    return files.map((file) => {
      return `${dirname}/${file}`;
    });
  }

  /**
   * @description 待上传文件列表排序，将文件夹放在最后进行上传，实现广度优先遍历
   * @private
   * @param {*} list 待上传文件列表
   * @memberof UploadController
   */
  private sortFileList(list) {
    list.sort((a, b) => {
      const fextname = path.extname(a);
      const sextname = path.extname(b);
      return sextname.length - fextname.length;
    });
  }
}
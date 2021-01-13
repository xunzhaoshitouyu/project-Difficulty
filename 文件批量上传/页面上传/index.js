/*
 * @Date: 2020-12-30 11:37:36
 * @Last Modified time: 2021-01-12 14:57:44
 */
import React from 'react';
import Root, { bindActions } from '@/lib/root';
import { connect } from 'react-redux';
import { Upload, Button, Modal, Dropdown, Menu, Tooltip, Empty } from 'antd';
import {
  FileTwoTone,
  FolderTwoTone,
  InfoCircleOutlined
} from '@ant-design/icons';
import { reject } from 'lodash';


const AuthButton = WrapAuth(Button);
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

const tempCheckpoint = oss.pause(); // 暂停上传

const MAX_SIZE = 1024 * 1024 * 1024 * 4; // 一次最大上传文件大小
const MAX_UPLOAD_NUMBER = 5; // 最大同时上传文件数

@connect((state) => state, bindActions)
export default class UploadComponent extends Root {
  constructor(props) {
    super(props);
    this.state = {
      previewVisible: false,
      previewImage: '',
      previewTitle: '',
      uploading: false,
      uploadText: '开始上传',
      fileList: [], // 待上传文件列表
      successFileList: [], // 上传成功的文件列表
      errorFileList: [] // 上传失败的文件列表
    };
    this.uploadFileRef = null;
    this.uploadFolderRef = null;
    this.successList = []; // 上传成功的文件列表
    this.willUploadFiles = []; // 所有需要上传的文件列表
    this.residueList = []; // 剩余待上传文件
    this.filePool = []; // 上传文件池
  }

  /**
   * @description 开始上传文件
   
   * @memberof UploadComponent
   */
  upload = async () => {
    this.props.setLoading({ showLoading: true });
    // 清空选择器的数据
    this.uploadFileRef.clearFileList();
    // 禁用按钮
    this.setState({
      uploading: true,
      uploadText: '正在上传，请稍等'
    });

    this.filePool = this.willUploadFiles.splice(0, MAX_UPLOAD_NUMBER);

    this.uploadFromFilePool();
  };

  /**
   * @description 从文件池获取文件进行上传
   
   * @memberof UploadComponent
   */
  uploadFromFilePool = () => {
    while (this.filePool.length) {
      const file = this.filePool.shift();
      this.uploadHandler(file);
    }
  };

  /**
   * @description 显示文件上传进度条
   
   * @param {*} uid 文件uid
   * @param {*} file 实时文件信息
   * @memberof UploadComponent
   */
  updateProcess = (uid, file) => {
    const { fileList } = this.state;
    // 找到对象的索引
    const index = fileList.findIndex((file) => file.uid === uid);

    fileList.splice(index, 1, file);

    this.setState({
      fileList: [...fileList]
    });
  };

  /**
   * @description 文件上传处理程序
   
   * @param {*} file 上传的文件
   * @memberof UploadComponent
   */
  uploadHandler = async (file) => {
    // const file = this.willUploadFiles[i];
    let cover_imgurl = 'https://pics4.baidu.com/feed/6a600c338744ebf8fac9d08ddeac342d6159a7a1.jpeg?token=15c98c473058d3435cb654f91b23bd57&s=D382D20456FB1D8E3A1492B1030050A1';
    let show_imgurl = 'https://pics4.baidu.com/feed/6a600c338744ebf8fac9d08ddeac342d6159a7a1.jpeg?token=15c98c473058d3435cb654f91b23bd57&s=D382D20456FB1D8E3A1492B1030050A1';
    const { name, tag, type, uid, url: previewUrl } = file;

    file.status = 'uploading';
    const { status, url } = await oss.multipartUpload(file, (p) => {
      file.percent = p * 100;
      this.updateProcess(uid, file);
    });
    // 200表示上传成功
    if (status === 200) {
      if (previewUrl) {
        cover_imgurl = url;
        show_imgurl = url;
      }

      const { success } = await this.saveFile({
        name,
        tag,
        fileType: type,
        resourceUrl: url,
        cover_imgurl,
        show_imgurl
      });

      // 保存成功
      if (success) {
        file.status = 'done';
        this.successList.push(file);
        this.residueList = reject(this.residueList, (item) => item.uid === uid);
        this.setState({
          fileList: [...this.residueList],
          successFileList: [...this.successList]
        });
      } else {
        // 保存失败
        file.status = 'error';
        this.residueList.splice(i, 1, file);
        this.setState({
          fileList: [...this.residueList]
        });
      }

      // if (!this.filePool.length) {
      //   this.resetPageStatus();
      // }
    }

    // 阿里云出错
    if (status === 500) {
      file.status = 'error';
      this.residueList.splice(i, 1, file);
      this.setState({
        fileList: [...this.residueList]
      });
    }

    // 一个文件上传完之后，如果还有待上传文件，则给文件池添加一个文件
    if (this.willUploadFiles.length) {
      const element = this.willUploadFiles.shift();
      this.filePool.push(element);
      this.uploadFromFilePool();
    } else {
      if (!this.filePool.length) {
        this.resetPageStatus();
      }
    }
  };

  /**
   * @description 重置页面上传状态
   
   * @memberof UploadComponent
   */
  resetPageStatus = () => {
    this.setState({
      uploading: false,
      uploadText: '开始上传'
    });
    this.props.setLoading({ showLoading: false });
  };

  /**
   * @description 保存上传的文件
   
   * @param {*} { name, tag, fileType, resourceUrl }
   * @memberof UploadComponent
   */
  saveFile = ({
    name,
    tag,
    fileType,
    resourceUrl,
    cover_imgurl,
    show_imgurl
  }) =>
    this.props.post(
      '/admin/api/saveFile',
      {
        tag,
        file_type: fileType,
        name,
        resource_url: resourceUrl,
        cover_imgurl,
        show_imgurl
      },
      { hideLoading: true }
    );

  handleCancel = () => this.setState({ previewVisible: false });

  /**
   * @description 文件预览
   
   * @param {*} file
   * @memberof UploadComponent
   */
  handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    this.setState({
      previewImage: file.url || file.preview,
      previewVisible: true,
      previewTitle:
        file.name || file.url.substring(file.url.lastIndexOf('/') + 1)
    });
  };

  /**
   * @description 选择文件按钮
   
   * @memberof UploadComponent
   */
  UploadMenu = () => (
    <Menu>
      <Menu.Item>
        <UploadFile
          addUploadFile={this.addUploadFile}
          ref={(btn) => (this.uploadFileRef = btn)}
        />
      </Menu.Item>
      <Menu.Item>
        <UploadFile
          addUploadFile={this.addUploadFile}
          folder
          ref={(btn) => (this.uploadFolderRef = btn)}
        />
      </Menu.Item>
    </Menu>
  );

  /**
   * @description 将要上传的文件添加到state
   
   * @param {*} fileList 文件列表
   * @memberof UploadComponent
   */
  addUploadFile = (fileList) => {
    this.willUploadFiles = [...fileList];
    this.residueList = [...fileList];
    this.setState(
      {
        fileList
      }
      // this.upload
    );
  };

  /**
   * @description 移除文件
   
   * @param {*} file 要移除的文件
   * @memberof UploadComponent
   */
  removeFile = (file) => {
    const { uid } = file;
    const { fileList } = this.state;
    if (this.uploadFileRef) {
      this.uploadFileRef.removeFile(uid);
    }

    if (this.uploadFolderRef) {
      this.uploadFolderRef.removeFile(uid);
    }
    const newFileList = fileList.filter((item) => item.uid !== uid);
    this.willUploadFiles = [...newFileList];
    this.residueList = [...newFileList];
    this.setState({ fileList: [...newFileList] });
  };

  /**
   * @description 清空上传列表
   
   * @memberof UploadComponent
   */
  clearFileList = () => {
    if (this.uploadFileRef) {
      this.uploadFileRef.clearFileList();
    }

    if (this.uploadFolderRef) {
      this.uploadFolderRef.clearFileList();
    }
    this.residueList = [];
    this.willUploadFiles = [];
    this.setState({ fileList: [] });
  };

  render() {
    const {
      previewTitle,
      previewVisible,
      previewImage,
      fileList,
      successFileList,
      uploading,
      uploadText
    } = this.state;
    return (
      <div className="wdc-batch-upload-container">
        <div className="wdc-tool-bar">
          <Tooltip
            className="wdc-batch-upload"
            title="单次最大上传容量4g，如果您的文件超过限制，请分批上传"
          >
            <InfoCircleOutlined />
          </Tooltip>
          <Dropdown arrow overlay={this.UploadMenu}>
            <AuthButton
              authId="upload-choose-file-button"
              className="wdc-batch-upload"
              type="primary"
            >
              选择文件
            </AuthButton>
          </Dropdown>

          {fileList.length > 0 && (
            <Button
              className="wdc-batch-upload"
              disabled={uploading}
              onClick={this.upload}
            >
              {uploadText}
            </Button>
          )}
          {fileList.length > 0 && !uploading && (
            <Button danger onClick={this.clearFileList}>
              清空待上传列表
            </Button>
          )}
          {/* {fileList.length > 0 && uploading && (
            <Button onClick={this.pauseUpload}>暂停上传</Button>
          )} */}
        </div>
        <div className="wdc-file-place">
          <h3 className="wdc-upload-header">待上传文件</h3>
          {fileList.length ? (
            <Upload
              beforeUpload={() => false}
              className="wdc-batch-upload-file-list"
              fileList={fileList}
              listType="picture-card"
              onPreview={this.handlePreview}
              onRemove={this.removeFile}
              progress={{
                strokeColor: {
                  '0%': '#108ee9',
                  '100%': '#87d068'
                },
                strokeWidth: 3,
                format: (percent) => `${parseFloat(percent.toFixed(2))}%`
              }}
            />
          ) : (
            <Empty className="wdc-empty" />
          )}
        </div>
        <div className="wdc-file-place">
          <h3 className="wdc-upload-header">已上传文件</h3>
          {successFileList.length ? (
            <Upload
              beforeUpload={() => false}
              className="wdc-batch-upload-file-list"
              directory
              fileList={successFileList}
              listType="picture-card"
              multiple
              onPreview={this.handlePreview}
              onRemove={this.removeFile}
            />
          ) : (
            <Empty className="wdc-empty" />
          )}
        </div>

        <Modal
          footer={null}
          onCancel={this.handleCancel}
          title={previewTitle}
          visible={previewVisible}
        >
          <img alt="example" src={previewImage} style={{ width: '100%' }} />
        </Modal>
      </div>
    );
  }
}

/**
 * @description 批量上传文件
 
 * @class UploadFile
 * @augments {Root}
 */
class UploadFile extends Root {
  constructor(props) {
    super(props);
    this.fileList = [];
    this.fileUidList = [];
    this.totalSize = 0;
  }

  /**
   * @description 将文件统一放入缓存
   
   * @param {*} file
   * @memberof UploadFile
   */
  beforeUpload = async (file) => {
    const { addUploadFile } = this.props;
    const { name, webkitRelativePath, lastModified, size, type } = file;
    const verifyPicFileReg = /\.(jpg|gif|jpeg|png|swf|bmp)$/i; // 校验是不是文件
    const reg = /^\./;
    // 判断是否是以.开头的文件
    const isBeginWithDot = reg.test(name);
    const isPic = verifyPicFileReg.test(name);

    if (isBeginWithDot) {
      return;
    }

    // 计算已选择文件的总大小
    this.totalSize += size;

    if (this.totalSize > MAX_SIZE) {
      return false;
    }
    let url;

    if (isPic) {
      url = await getBase64(file);
    }
    // let path = [];
    const path = webkitRelativePath.split('/');
    path.pop();

    const uid = name + lastModified + size + type;

    const fileInfo = {
      name,
      uid,
      url,
      // status: 'uploading',
      percent: 0,
      tag: `${name} ${path.join(' ')}`,
      type,
      originFileObj: file
    };
    // 一个文件只能上传一次
    if (this.fileUidList.indexOf(uid) > -1) {
      return false;
    }
    this.fileUidList.push(uid);
    this.fileList.push(fileInfo);

    addUploadFile(this.fileList, this.fileUidList);
    // // 重置数据
    // this.fileUidList = [];
    // this.fileList = [];
    return false;
  };

  /**
   * @description 移除文件
   
   * @param {*} uid 文件uid
   * @memberof UploadFile
   */
  removeFile = (uid) => {
    const index = this.fileUidList.indexOf(uid);
    this.fileList.splice(index, 1);
    this.fileUidList.splice(index, 1);
  };

  clearFileList = () => {
    this.fileList = [];
    this.fileUidList = [];
  };

  render() {
    const { folder } = this.props;
    return (
      <Upload
        beforeUpload={this.beforeUpload}
        customRequest={() => false}
        directory={folder}
        multiple
        showUploadList={false}
      >
        {folder ? (
          <Tooltip
            placement="right"
            title="将一个文件夹下所有文件(包含子目录的文件)上传到云端"
          >
            <FolderTwoTone
              style={{ marginRight: '10px' }}
              twoToneColor="#52c41a"
            />
            上传文件夹
          </Tooltip>
        ) : (
          <Tooltip placement="right" title="批量选择要上传到云端的文件">
            <FileTwoTone
              style={{ marginRight: '10px' }}
              twoToneColor="#52c41a"
            />
            上传文件
          </Tooltip>
        )}
      </Upload>
    );
  }
}

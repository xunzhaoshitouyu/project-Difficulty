<template>
  <div
    id="panora-container"
    class="custom-scrollbar"
  >
    <a-row
      type="flex"
      justify="space-between"
      align="middle"
    >
      <a-col :span="4">
        <h4
          :style="{fontWeight:'bold', cursor: 'pointer'}"
          @click="back"
          accesskey="c"
        >
          <a-icon type="left" />返回患者预览页
        </h4>
      </a-col>
    </a-row>

    <!-- 患者基本信息 -->
    <div class="patient-basic-info">
      <div class="row">
        <a-col class="item">
          <span class="label">患者姓名</span>
          <span class="info">{{patientInfo.tpatname}}</span>
        </a-col>
        <a-col class="item">
          <span class="label">性别</span>
          <span class="info">{{patientInfo.gender}}</span>
        </a-col>
        <a-col class="item">
          <span class="label">年龄</span>
          <span class="info">{{patientInfo.age}}</span>
        </a-col>
        <a-col class="item">
          <span class="label">身高</span>
          <span class="info">{{patientInfo.height}} cm</span>
        </a-col>
        <a-col class="item">
          <span class="label">体重</span>
          <span class="info">{{patientInfo.weight}} kg</span>
        </a-col>
      </div>
      <div class="row">
        <a-col class="item">
          <span class="label">入院时间</span>
          <span class="info">{{patientInfo.admission_date_time}}</span>
        </a-col>
        <a-col class="item">
          <span class="label">入院诊断</span>
          <span class="info">{{patientInfo.diagnosis}}</span>
        </a-col>
        <a-col class="item">
          <span class="label">发作到住院时间</span>
          <span class="info">{{patientInfo.time_onset_to_hostipal}}小时</span>
        </a-col>
      </div>
      <div class="row">
        <a-col class="item">
          <span class="label">血管重建方案</span>
          <span class="info">{{patientInfo.thrombolysis}}</span>
        </a-col>
      </div>
      <div class="row">
        <a-col class="item">
          <span class="label">发病前状态</span>
          <span class="info">
            <span
              v-for="(state,index) in patientInfo.state"
              :key="state"
            >
              <span v-if="index == patientInfo.past_history.length-1">{{state}}</span>
              <span v-else>{{state}}、</span>
            </span>
          </span>
        </a-col>
        <a-col class="item">
          <span class="label">既往史</span>
          <span class="info">
            <span
              v-for="(state,index) in patientInfo.past_history"
              :key="state"
            >
              <span v-if="index == patientInfo.past_history.length-1">{{state}}</span>
              <span v-else>{{state}}、</span>
            </span></span>
        </a-col>
        <a-col class="item">
          <span class="label">当前心电图</span>
          <span class="info">{{patientInfo.electrocardiogram}}</span>
        </a-col>
      </div>

    </div>

    <!-- 内容区域 -->
    <div class="content">
      <div class="content-header">
        <span>{{hos_start_end_date[0]}}</span>
        <span>{{hos_start_end_date[1]}}</span>
      </div>
      <div class="top-nav">
        <ul class="nav-container">
          <li
            class="nav-item"
            v-for="nav in category"
            :key="nav.id"
            @click="anchor(nav.id)"
          >{{nav.title}}</li>
        </ul>
        <div class="filter-container">
          <a-checkbox @change="showAbnormal">仅显示异常情况</a-checkbox>
        </div>
      </div>
      <a-collapse
        :bordered="false"
        activeKey="0"
        v-for="chart in category"
        :key="chart.id"
        :id="chart.id"
      >
        <!-- <a-collapse-panel header="生命体征">
          <div class="echart-container">
            <div>111</div>
          </div>
        </a-collapse-panel> -->
        <a-collapse-panel :header="chart.title">
          <div
            v-for="(data,index) in chart.child"
            :key="data.id"
          >
            <div
              v-if="!data.seriesData"
              class="echart-container second-container"
            >
              <p class="second-title">{{data.title}}</p>
              <div
                class="echart-item-parent"
                v-for="thr in data.child"
                :key="thr.id"
              >
                <div
                  v-show="!onlyAbnormal || thr.isAbnormal"
                  class="echart-item"
                  :data-echartId="thr.id"
                ></div>
              </div>
            </div>
            <div
              v-if="data.seriesData && index==1"
              class="echart-container"
            >
              <div
                class="echart-item-parent"
                v-for="data in chart.child"
                :key="data.id"
              >
                <div
                  v-show="!onlyAbnormal || data.isAbnormal"
                  class="echart-item"
                  :data-echartId="data.id"
                ></div>
              </div>
            </div>

          </div>
          <!-- <div class="echart-container">
            <div
              class="echart-item-parent"
              v-for="data in chart.child"
              :key="data.id"
            >
              <p v-if="!data.seriesData">{{data.title}}</p>
              <div
                v-else
                v-show="!onlyAbnormal || data.isAbnormal"
                class="echart-item"
                :data-echartId="data.id"
              ></div>
            </div>
          </div> -->
        </a-collapse-panel>
        <!-- <a-collapse-panel
          header="患者生命体征"
          id="vitalSigns"
          key="1"
        >
          <div class="echart-container">
            <div
              class="echart-item"
              v-for="(data, index) in echartsTestData"
              :key="index"
            ></div>
          </div>
        </a-collapse-panel>
        <a-collapse-panel
          id="complication"
          header="合并症·并发症"
          key="2"
        >
          <div class="date-line">
            <span class="date-line-label">肺水肿</span>
            <div class="date-line-chunk">
              <div
                class="chunk-item"
                title="记录：丁医生（2019-12-17 18:12）
取消：王护士（2019-12-18 9:30）"
              ></div>
            </div>
          </div>
        </a-collapse-panel>
        <a-collapse-panel
          id="labExamination"
          header="实验室检查"
          key="3"
        >
          <div class="echart-container">
            <div
              class="echart-item"
              v-for="(data, index) in echartsTestData"
              :key="index"
            ></div>
          </div>
        </a-collapse-panel> -->
      </a-collapse>
    </div>
  </div>
</template>
<script>
import echarts from "@/assets/lib/echarts";
import Option from './echartsOption.js';
import { panoramaPatientInfo } from "@/config/patient";
import Chart from './Chart'
export default {
  name: "patient",
  components: { Chart },
  data () {
    return {
      text: `A dog is a type of domesticated animal.Known for its loyalty and faithfulness,it can be found as a welcome guest in many households across the world.`,
      patientId: "",
      batch: "",
      patientInfo: panoramaPatientInfo,
      hos_start_end_date: [],
      cdssInfo: [],
      category: [],
      onlyAbnormal: false
    };
  },
  created () {
    this.patientId = this.$route.params.id;
    this.batch = this.$route.params.batch;
    this.getPanorama();
  },
  mounted () {

  },
  updated () {
    this.draw();
  },
  methods: {
    getPanorama () {
      Service.post(WsConfig.panorama, { patient_id: this.patientId }).then(res => {
        if (res.success) {
          this.patientInfo = res.data.patientMainInfo;
          this.hos_start_end_date = res.data.time_start_to_end;
          this.category = res.data.diagram;
          this.addAttribute(this.category, 'id', 'category');
        } else {
        }
      });
    },
    back () {
      this.$router.push({
        name: "patient",
        params: { id: this.patientId, batch: this.batch }
      });
    },
    // 划重点
    draw () {
      const echartNodes = document.getElementsByClassName("echart-item");
      for (let node of echartNodes) {
        // 获取绑定的数据
        const echartId = node.dataset.echartid;
        const echartData = this.dfsFindData(this.category, echartId)
        const myChart = echarts.init(node);
        if (echartData) {
          const option = new Option(echartData);
          // 绘制条形图
          myChart.setOption(option.getOption());
        }
      }
    },
    anchor (id) {
      $("#panora-container").parent().animate(
        {
          scrollTop:
            $("#panora-container").parent().scrollTop() +
            $("#" + id).offset().top -
            $("#panora-container").parent().offset().top - 80
        },
        1000
      );
    },
    // 给接口返回的数据添加属性
    addAttribute (element, attributeName, prefix) {
      element.forEach((item, index) => {
        item[attributeName] = prefix + '-' + index;
        if (item.abnormal && item.abnormal.length > 0) {
          const abnormal = _.cloneDeep(item.abnormal);
          const flatArray = _.flattenDeep(abnormal);
          const index = _.findIndex(flatArray, v => {
            return v == 1 || v == 2;
          })
          if (index == -1) {
            item.isAbnormal = false;
          } else {
            item.isAbnormal = true;
          }
        }
        if (item.child && item.child.length > 0) {
          this.addAttribute(item.child, attributeName, prefix + '-' + index);
        }
      })
    },
    // 深度优先查找图表元素对应的数据
    dfsFindData (collection, target) {
      let result;
      let length = collection.length;
      let index = 0;
      while (length > 0) {
        if (collection[index].id == target) {
          result = collection[index];
        }
        if (collection[index].child && collection[index].child.length > 0) {
          result = this.dfsFindData(collection[index].child, target);
        }
        if (result) {
          break
        }
        length--;
        index++;
      }
      return result
    },
    // 是否晋显示异常情况
    showAbnormal (e) {
      this.onlyAbnormal = e.target.checked;
    }
  }
};
</script>
<style lang="less" scoped>
.echart-container {
  display: flex;
  flex-wrap: wrap;
  .echart-item {
    flex: 1;
    min-width: 500px;
    height: 300px;
    margin: 20px 30px 0 0;
    border: 1px solid #ccc;
  }
}

.patient-basic-info {
  background: #fff;
  margin: 21px 0 16px;
  padding: 15px 25px;

  .row {
    display: flex;
    flex-wrap: wrap;
    .item {
      margin: 0 20px;
      line-height: 32px;
    }
  }
}

.flex-item {
  display: flex;
  flex-wrap: wrap;
}

.content-header {
  margin: 20px 0;
  height: 40px;
  line-height: 40px;
  padding: 0 40px;
  background: #81d3f8;
  border-radius: 10px;
  position: relative;
  display: flex;
  justify-content: space-between;
  &::before {
    display: block;
    content: "";
    position: absolute;
    width: 8px;
    height: 56px;
    background: #81d3f8;
    top: 50%;
    transform: translateY(-50%);
    box-shadow: 0 0 8px rgb(24, 23, 23);
    border-radius: 2px;
    left: 20px;
  }
  &::after {
    display: block;
    content: "";
    position: absolute;
    width: 8px;
    height: 56px;
    background: #81d3f8;
    top: 50%;
    transform: translateY(-50%);
    box-shadow: 0 0 8px rgb(24, 23, 23);
    border-radius: 2px;
    right: 20px;
  }
}
.top-nav {
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  position: sticky;
  top: -30px;
  background: #fff;
  z-index: 2;

  .nav-container {
    display: flex;
    justify-content: space-between;
    .nav-item {
      margin-right: 30px;
      font-size: 18px;
      cursor: pointer;
    }
  }
}

.date-line {
  display: flex;
  position: relative;
  height: 40px;
  line-height: 40px;
  .date-line-label {
    min-width: 50px;
    text-align: left;
    margin-right: 10px;
  }
  .date-line-chunk {
    flex: 1;
    height: 2px;
    background: #ddd;
    position: relative;
    top: 50%;
    .chunk-item {
      position: absolute;
      left: 15%;
      top: 50%;
      transform: translateY(-50%);
      height: 30px;
      width: 150px;
      background: #36a9ce;
    }
  }
}

.second-container {
  margin-top: 20px;
  .second-title {
    width: 100%;
  }
}
</style>

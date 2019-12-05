
<template>
  <div style="height:100%;background:#fff;padding:0 10px;display:flex;flex-direction:column;">
    <a-input-search style="margin:10px 0;" placeholder="请输入搜索内容" enterButton @search="onSearch" />
    <section style="height:90%;" v-if="isSearch">
      <ul style="height:100%;overflow:auto;">
        <li class="search-item" v-for="(item,index) in searchData" :key="index">
          <h4>{{item.menu_name}}</h4>
          <p v-html="item.content"></p>
        </li>
      </ul>
    </section>
    <section style="height:90%;display:flex;" v-else>
      <menu type="toolbar" style="width:200px;border-right:1px solid #ddd;overflow:auto;">
        <a-tree
          :loadData="onLoadData"
          :treeData="treeData"
          :expandedKeys="expandedKeys"
          @expand="onExpand"
          @select="selectTreeNode"
        />
      </menu>
      <article id="content" style="flex:1;margin-left:10px;overflow:auto;">
        <div v-for="(item,index) in contentData" :id="item.id" :key="index">
          <span v-html="item.content"></span>
        </div>
      </article>
    </section>
  </div>
</template>
<script>
export default {
  name: "acs-repository",
  data() {
    return {
      treeData: [],
      contentData: [],
      firstContent: [],
      secondContent: [],
      expandedKeys: [],
      searchData: [],
      isSearch: false
    };
  },
  created() {
    this.getName();
  },
  methods: {
    getName() {
      Service.post(WsConfig.catalogMenu, {}).then(res => {
        if (res.success) {
          this.treeData = res.data;
          this.treeData.map(item => {
            item.title = item.catalogueName;
            item.key = item.id;
          });
        } else {
          this.treeData = [];
        }
      });
    },
    onExpand(expendkey, { expanded, node }) {
      if (node.dataRef.key == 1 || node.dataRef.key == 2) {
        if (node.dataRef.key == 1) {
          this.contentData = this.firstContent;
        } else {
          this.contentData = this.secondContent;
        }
        this.expandedKeys = [];
        if (expanded) {
          this.expandedKeys.push(node.dataRef.key);
        }
      } else {
        if (expanded) {
          this.expandedKeys.push(node.dataRef.key);
        } else {
          _.remove(this.expandedKeys, function(n) {
            return n == node.dataRef.key;
          });
          this.$forceUpdate();
        }
      }
    },
    onLoadData(treeNode) {
      return new Promise((resolve, reject) => {
        if (treeNode.dataRef.isLeaf == undefined) {
          Service.post(WsConfig.catalog, { shu_id: treeNode.dataRef.key }).then(
            res => {
              if (res.success) {
                treeNode.dataRef.children = this.formatData(
                  treeNode.dataRef.key,
                  res.data
                );
                this.dfsContent(
                  treeNode.dataRef.key,
                  treeNode.dataRef.key,
                  res.data
                );
                this.treeData = [...this.treeData];
                resolve();
              } else {
                reject();
              }
            }
          );
        } else {
          resolve();
          return;
        }
      });
    },
    formatData(prefix, oldData) {
      let newData = [];
      oldData.forEach(item => {
        let treeNode = {
          key: null,
          title: null,
          children: null,
          isLeaf: false
        };
        treeNode.key = prefix.toString() + item.id;
        treeNode.title = item.menu_name;
        treeNode.content = item.content;
        treeNode.isLeaf = !item.children.length;
        treeNode.children = item.children.length
          ? this.formatData(item.id, item.children)
          : [];
        newData.push(treeNode);
      });
      return newData;
    },
    dfsContent(prefix, parentId, originData) {
      originData.forEach(item => {
        const contentItem = {
          id: parentId.toString() + item.id,
          content: item.content
        };
        if (prefix == 1) {
          this.firstContent.push(contentItem);
          if (item.children.length) {
            this.dfsContent(prefix, item.id, item.children);
          }
        } else {
          this.secondContent.push(contentItem);
          if (item.children.length) {
            this.dfsContent(prefix, item.id, item.children);
          }
        }
      });
    },
    selectTreeNode(selectedKeys, { selected, selectedNodes, node, event }) {
      $("#content").animate(
        {
          scrollTop:
            $("#content").scrollTop() +
            $("#" + selectedNodes[0].key).offset().top -
            $("#content").offset().top
        },
        1000
      );
    },
    onSearch(value) {
      if (value.length) {
        this.isSearch = true;
      } else {
        this.isSearch = false;
        return;
      }
      Service.post(WsConfig.searchCatalog, { moHuSelect: value }).then(res => {
        if (res.success) {
          this.searchData = res.data;
          _.map(this.searchData, function(item) {
            item.content = item.content.replace(
              value,
              `<font color='#ff6700'><b>${value}</b></font>`
            );
          });
        } else {
          this.searchData = [];
        }
      });
    }
  }
};
</script>
<style lang="less" scoped>
.search-item {
  h4 {
    font-weight: bold;
  }
  border-bottom: 1px solid #ddd;
  margin: 5px 0;
}
</style>
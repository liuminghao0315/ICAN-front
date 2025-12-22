<template>
    <div id="Test">
        你好啊 ican {{ random }}
        <button @click="getRandom()">点我获取随机数（从springboot获取）</button>
    </div>
</template>

<script setup lang="ts" name="Test">
    import {ref} from 'vue';
    import axios from 'axios'
    const random = ref<number>(0);

    async function getRandom(){
        random.value=(await axios.get("http://localhost:8080/getRandom")).data
    }
</script>

<style lang="scss">
    #Test{
        font-size: 20px;

        button{
            color:green;
        }
    }
</style>
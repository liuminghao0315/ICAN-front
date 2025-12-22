<template>
    <div id="Test">
        你好啊 ican {{ att }}
        <button @click="add1()">点我att+1</button>
    </div>
</template>

<script setup lang="ts" name="Test">
    import {ref} from 'vue';
    const att = ref<number>(0);

    function add1(){
        att.value++;
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